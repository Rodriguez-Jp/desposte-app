import pandas as pd
import numpy as np
from typing import Dict, Optional

CORTE_MAP = {
    "lomo_fino":       ["lomo fino"],
    "lomo_aguja":      ["lomo aguja", "lomo de aguja"],
    "punta_anca":      ["punta de anca", "punta anca"],
    "cadera":          ["cadera"],
    "bola_negra":      ["bola negra"],
    "muchacho":        ["muchacho"],
    "costilla":        ["costilla"],
    "lagarto":         ["lagarto"],
    "pecho":           ["pecho"],
    "brazo":           ["brazo"],
    "molida":          ["molida"],
}


def procesar_datos_sipsa(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in ["precio_promedio", "precio_minimo", "precio_maximo"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["precio_promedio"])
    df = df[df["precio_promedio"] > 0]
    if "producto" in df.columns:
        df["producto"] = df["producto"].astype(str).str.strip()
    for col in ["fecha_inicio", "fecha_fin"]:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors="coerce")
    q1 = df["precio_promedio"].quantile(0.25)
    q3 = df["precio_promedio"].quantile(0.75)
    iqr = q3 - q1
    df = df[
        (df["precio_promedio"] >= q1 - 1.5 * iqr) &
        (df["precio_promedio"] <= q3 + 1.5 * iqr)
    ]
    return df.reset_index(drop=True)


def calcular_promedios_por_corte(df: pd.DataFrame) -> Dict[str, Dict]:
    if "producto" not in df.columns or df.empty:
        return {}
    resultados = {}
    for key, keywords in CORTE_MAP.items():
        pattern = "|".join(keywords)
        subset = df[df["producto"].str.contains(pattern, case=False, na=False)]
        if subset.empty:
            continue
        resultados[key] = {
            "precio_promedio": round(float(subset["precio_promedio"].mean()), 2),
            "precio_minimo":   round(float(subset["precio_minimo"].min()   if "precio_minimo" in subset.columns else subset["precio_promedio"].min()), 2),
            "precio_maximo":   round(float(subset["precio_maximo"].max()   if "precio_maximo" in subset.columns else subset["precio_promedio"].max()), 2),
            "desviacion":      round(float(subset["precio_promedio"].std()), 2),
            "registros":       len(subset),
            "tendencia":       _tendencia(subset),
        }
    return resultados


def _tendencia(df: pd.DataFrame) -> str:
    if "fecha_inicio" not in df.columns or len(df) < 3:
        return "ESTABLE"
    ordered = df.sort_values("fecha_inicio").tail(4)["precio_promedio"].values
    if len(ordered) < 2:
        return "ESTABLE"
    cambio = (ordered[-1] - ordered[0]) / ordered[0] * 100
    if cambio > 3:
        return "SUBIENDO"
    if cambio < -3:
        return "BAJANDO"
    return "ESTABLE"


def generar_precio_sugerido(
    costo_total: float,
    margen_objetivo: float,
    precio_sipsa: Optional[float] = None,
    categoria: str = "ESTANDAR",
) -> Dict:
    if margen_objetivo >= 100:
        margen_objetivo = 30.0
    precio_base = costo_total / (1 - margen_objetivo / 100)
    factor_cat = {"PREMIUM": 1.15, "ESTANDAR": 1.0, "ECONOMICO": 0.88}
    precio_ajustado = precio_base * factor_cat.get(categoria, 1.0)
    if precio_sipsa and precio_sipsa > 0:
        precio_final = precio_ajustado * 0.6 + precio_sipsa * 0.4
        confianza = 85.0
    else:
        precio_final = precio_ajustado
        confianza = 70.0
    margen_real = (precio_final - costo_total) / precio_final * 100 if precio_final > 0 else 0
    return {
        "precio_costo_unitario": round(costo_total, 2),
        "precio_sugerido":       round(precio_final, 2),
        "precio_minimo_viable":  round(precio_base, 2),
        "precio_sipsa_referencia": round(precio_sipsa, 2) if precio_sipsa else None,
        "margen_real":           round(margen_real, 2),
        "nivel_confianza":       confianza,
    }
