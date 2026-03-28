import logging
from sqlalchemy.orm import Session
from typing import List, Dict
from ..models import Animal, Corte, Costo, HistoricoSIPSA
from ..sipsa.client import get_sipsa_bovino_prices
from ..sipsa.processor import (
    procesar_datos_sipsa,
    calcular_promedios_por_corte,
    generar_precio_sugerido,
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
        key = corte.nombre.lower().replace(" ", "_")
        sipsa_info = precios_sipsa.get(key, {})
        precio_sipsa_ref = sipsa_info.get("precio_promedio")
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
    costos         = db.query(Costo).all()
    costo_prom     = sum(c.valor for c in costos) / len(costos) if costos else 0
    cortes_c       = [c for c in db.query(Corte).all() if c.margen_ganancia]
    margen_prom    = sum(c.margen_ganancia for c in cortes_c) / len(cortes_c) if cortes_c else 0
    sipsa_count    = db.query(HistoricoSIPSA).count()
    return {
        "total_animales":    total_animales,
        "total_cortes":      total_cortes,
        "costo_promedio_kg": round(costo_prom, 2),
        "margen_promedio":   round(margen_prom, 2),
        "registros_sipsa":   sipsa_count,
    }
