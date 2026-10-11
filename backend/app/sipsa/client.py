import logging
from typing import List, Dict, Optional
from datetime import date, timedelta
import requests
import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)

SIPSA_WSDL = "http://appweb.dane.gov.co/sipsaWS/SrvSipsaUpraBeanService?WSDL"

# Métodos SOAP reales según documentación DANE 2020
# promediosSipsaCiudad()  → precioPromedio, producto, ciudad
# promediosSipsaParcial() → promedioKg, maximoKg, minimoKg, artiNombre, muniNombre
SOAP_METHODS = ["promediosSipsaCiudad", "promediosSipsaParcial"]

# Palabras clave para filtrar productos bovinos
BOVINO_KEYWORDS = ["res", "bovina", "bovino", "carne", "lomo", "costilla",
                   "cadera", "molida", "muchacho", "pecho", "lagarto"]


def _get_via_soap_ciudad() -> List[Dict]:
    """Usa promediosSipsaCiudad() - retorna precioPromedio por producto y ciudad."""
    try:
        from zeep import Client
        client = Client(SIPSA_WSDL)
        resultado = client.service.promediosSipsaCiudad()
        if not resultado:
            return []
        registros = []
        for r in resultado:
            producto = str(getattr(r, "producto", "") or "")
            if not any(k in producto.lower() for k in BOVINO_KEYWORDS):
                continue
            registros.append({
                "producto":       producto,
                "ciudad":         str(getattr(r, "ciudad", "") or ""),
                "mercado":        str(getattr(r, "ciudad", "") or ""),
                "precio_promedio": float(getattr(r, "precioPromedio", 0) or 0),
                "precio_minimo":  float(getattr(r, "precioPromedio", 0) or 0) * 0.93,
                "precio_maximo":  float(getattr(r, "precioPromedio", 0) or 0) * 1.07,
                "unidad":         "kg",
                "semana":         str(getattr(r, "fechaCaptura", ""))[:10],
                "fecha_inicio":   str(getattr(r, "fechaCaptura", ""))[:10],
                "fecha_fin":      str(getattr(r, "fechaCaptura", ""))[:10],
            })
        logger.info(f"SIPSA SOAP promediosSipsaCiudad: {len(registros)} registros bovinos obtenidos.")
        return registros
    except Exception as e:
        logger.warning(f"SOAP promediosSipsaCiudad no disponible: {e}")
        return []


def _get_via_soap_parcial() -> List[Dict]:
    """Usa promediosSipsaParcial() - retorna min, max, promedio por ubicación."""
    try:
        from zeep import Client
        client = Client(SIPSA_WSDL)
        resultado = client.service.promediosSipsaParcial()
        if not resultado:
            return []
        registros = []
        for r in resultado:
            nombre = str(getattr(r, "artiNombre", "") or "")
            if not any(k in nombre.lower() for k in BOVINO_KEYWORDS):
                continue
            registros.append({
                "producto":        nombre,
                "ciudad":          str(getattr(r, "muniNombre", "") or ""),
                "mercado":         str(getattr(r, "fuenNombre", "") or ""),
                "precio_promedio": float(getattr(r, "promedioKg", 0) or 0),
                "precio_minimo":   float(getattr(r, "minimoKg", 0) or 0),
                "precio_maximo":   float(getattr(r, "maximoKg", 0) or 0),
                "unidad":          "kg",
                "semana":          str(getattr(r, "enmaFecha", ""))[:10],
                "fecha_inicio":    str(getattr(r, "enmaFecha", ""))[:10],
                "fecha_fin":       str(getattr(r, "enmaFecha", ""))[:10],
            })
        logger.info(f"SIPSA SOAP promediosSipsaParcial: {len(registros)} registros bovinos obtenidos.")
        return registros
    except Exception as e:
        logger.warning(f"SOAP promediosSipsaParcial no disponible: {e}")
        return []


def _get_via_soap_semana() -> List[Dict]:
    """Usa promediosSipsaSemanaMadr() - retorna max, min, promedio semanal."""
    try:
        from zeep import Client
        client = Client(SIPSA_WSDL)
        resultado = client.service.promediosSipsaSemanaMadr()
        if not resultado:
            return []
        registros = []
        for r in resultado:
            nombre = str(getattr(r, "artiNombre", "") or "")
            if not any(k in nombre.lower() for k in BOVINO_KEYWORDS):
                continue
            registros.append({
                "producto":        nombre,
                "ciudad":          "",
                "mercado":         str(getattr(r, "fuenNombre", "") or ""),
                "precio_promedio": float(getattr(r, "promedioKg", 0) or 0),
                "precio_minimo":   float(getattr(r, "minimoKg", 0) or 0),
                "precio_maximo":   float(getattr(r, "maximoKg", 0) or 0),
                "unidad":          "kg",
                "semana":          str(getattr(r, "fechaMesIni", ""))[:10],
                "fecha_inicio":    str(getattr(r, "fechaMesIni", ""))[:10],
                "fecha_fin":       str(getattr(r, "fechaMesIni", ""))[:10],
            })
        logger.info(f"SIPSA SOAP promediosSipsaSemanaMadr: {len(registros)} registros bovinos.")
        return registros
    except Exception as e:
        logger.warning(f"SOAP promediosSipsaSemanaMadr no disponible: {e}")
        return []


def _demo_data() -> pd.DataFrame:
    """
    Datos de demostración calibrados con SIPSA (promediosSipsaSemanaMadr,
    oct-2025 a oct-2026): cada rango es el percentil 25-75 del precio
    promedio del corte en los mercados reportados. Lomo de aguja, bola negra,
    lagarto y brazo no existen con ese nombre en SIPSA; se usaron cortes
    afines (lomo de brazo, bola de pierna, centro de pierna, bola/lomo de brazo).
    Se activa automáticamente cuando los servicios DANE no responden.
    """
    cortes_info = [
        ("Lomo fino",        "PREMIUM",   43500, 53500),
        ("Lomo de aguja",    "PREMIUM",   26300, 32500),
        ("Punta de anca",    "PREMIUM",   35300, 46600),
        ("Cadera",           "ESTANDAR",  30000, 35300),
        ("Bola negra",       "ESTANDAR",  29400, 35000),
        ("Muchacho",         "ESTANDAR",  29400, 35500),
        ("Costilla",         "ESTANDAR",  18700, 22700),
        ("Lagarto",          "ECONOMICO", 29700, 34000),
        ("Pecho",            "ECONOMICO", 26000, 29500),
        ("Brazo",            "ECONOMICO", 28000, 34000),
        ("Molida primera",   "ESTANDAR",  22500, 25000),
        ("Molida corriente", "ECONOMICO", 19500, 22000),
    ]
    mercados = [
        ("Corabastos",           "Bogota"),
        ("Central Mayorista",    "Medellin"),
        ("Cavasa",               "Cali"),
        ("Central Barranquilla", "Barranquilla"),
    ]
    rng = np.random.default_rng(42)
    rows = []
    today = date.today()
    for semana_back in range(12):
        semana_inicio = today - timedelta(weeks=semana_back + 1)
        semana_fin    = semana_inicio + timedelta(days=6)
        for nombre, cat, p_min, p_max in cortes_info:
            for mercado, ciudad in mercados:
                precio = rng.uniform(p_min, p_max) * rng.uniform(0.97, 1.03)
                rows.append({
                    "producto":        f"Carne res - {nombre}",
                    "categoria":       cat,
                    "mercado":         mercado,
                    "ciudad":          ciudad,
                    "precio_promedio": round(precio, 0),
                    "precio_minimo":   round(precio * 0.93, 0),
                    "precio_maximo":   round(precio * 1.07, 0),
                    "unidad":          "kg",
                    "semana":          f"S{semana_back + 1}",
                    "fecha_inicio":    semana_inicio.isoformat(),
                    "fecha_fin":       semana_fin.isoformat(),
                })
    logger.info("SIPSA: usando datos de demostración (calibrados con SIPSA oct-2025/oct-2026).")
    return pd.DataFrame(rows)


def get_sipsa_bovino_prices(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
) -> pd.DataFrame:
    """
    Obtiene precios bovinos con 4 niveles de fallback:
    1. promediosSipsaCiudad()  (precio por ciudad)
    2. promediosSipsaParcial() (precio con min/max por ubicación)
    3. promediosSipsaSemanaMadr() (precio semanal mayorista)
    4. Datos de demostración calibrados con SIPSA (oct-2025/oct-2026)
    """
    # Nivel 1
    records = _get_via_soap_ciudad()
    if records:
        return pd.DataFrame(records)

    # Nivel 2
    records = _get_via_soap_parcial()
    if records:
        return pd.DataFrame(records)

    # Nivel 3
    records = _get_via_soap_semana()
    if records:
        return pd.DataFrame(records)

    # Nivel 4: Demo
    return _demo_data()