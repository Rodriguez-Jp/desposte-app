import logging
from sqlalchemy.orm import Session
from typing import List, Dict
from ..models import Animal, Corte, Costo, HistoricoSIPSA, Precio
from ..sipsa.client import get_sipsa_bovino_prices
from ..sipsa.processor import (
    procesar_datos_sipsa,
    calcular_promedios_por_corte,
    generar_precio_sugerido,
    encontrar_key_sipsa,
)

logger = logging.getLogger(__name__)


def calcular_rendimiento_animal(animal: Animal) -> float:
    if animal.peso_canal and animal.peso_vivo > 0:
        return round((animal.peso_canal / animal.peso_vivo) * 100, 2)
    return 55.0


def calcular_costo_por_kg(animal: Animal, db: Session) -> float:
    costos = db.query(Costo).filter(Costo.animal_id == animal.id).all()
    costo_adicional = sum(c.valor for c in costos)
    peso_canal = animal.peso_canal or (animal.peso_vivo * 0.55)
    if peso_canal > 0:
        return round((animal.precio_compra + costo_adicional) / peso_canal, 2)
    return 0.0


def calcular_precios_cortes(animal_id: int, margen: float, db: Session) -> List[Dict]:
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        return []
    costo_kg = calcular_costo_por_kg(animal, db)
    cortes = db.query(Corte).filter(Corte.animal_id == animal_id).all()
    df_sipsa = get_sipsa_bovino_prices()
    df_clean = procesar_datos_sipsa(df_sipsa)
    precios_sipsa = calcular_promedios_por_corte(df_clean)
    resultados = []
    for corte in cortes:
        key = encontrar_key_sipsa(corte.nombre)
        sipsa_info = precios_sipsa.get(key, {}) if key else {}
        precio_sipsa_ref = sipsa_info.get("precio_promedio")
        precio_sipsa_max = sipsa_info.get("precio_maximo")
        calc = generar_precio_sugerido(
            costo_total=costo_kg,
            margen_objetivo=margen,
            precio_sipsa=precio_sipsa_ref,
            categoria=corte.categoria or "ESTANDAR",
        )
        corte.precio_sugerido = calc["precio_sugerido"]
        corte.precio_mercado_sipsa = precio_sipsa_ref
        corte.margen_ganancia = calc["margen_real"]
        db.add(corte)
        registro_precio = Precio(
            corte_id=corte.id,
            precio_costo_unitario=calc["precio_costo_unitario"],
            precio_sugerido=calc["precio_sugerido"],
            margen_objetivo=margen,
            precio_sipsa_referencia=calc.get("precio_sipsa_referencia"),
            precio_minimo_viable=calc.get("precio_minimo_viable"),
            precio_maximo_mercado=precio_sipsa_max,
            nivel_confianza=calc.get("nivel_confianza"),
            activo=True,
        )
        db.add(registro_precio)
        resultados.append({
            "corte_id":     corte.id,
            "corte_nombre": corte.nombre,
            "categoria":    corte.categoria,
            "peso_kg":      corte.peso_kg,
            **calc,
        })
    db.commit()
    return resultados


def get_dashboard_metrics(db: Session) -> Dict:
    total_animales = db.query(Animal).count()
    total_cortes   = db.query(Corte).count()
    animales       = db.query(Animal).all()
    costos_por_kg  = [calcular_costo_por_kg(a, db) for a in animales]
    costos_por_kg  = [v for v in costos_por_kg if v > 0]
    costo_prom_kg  = sum(costos_por_kg) / len(costos_por_kg) if costos_por_kg else 0
    cortes_c       = [c for c in db.query(Corte).all() if c.margen_ganancia]
    margen_prom    = sum(c.margen_ganancia for c in cortes_c) / len(cortes_c) if cortes_c else 0
    sipsa_count    = db.query(HistoricoSIPSA).count()
    return {
        "total_animales":    total_animales,
        "total_cortes":      total_cortes,
        "costo_promedio_kg": round(costo_prom_kg, 2),
        "margen_promedio":   round(margen_prom, 2),
        "registros_sipsa":   sipsa_count,
    }
