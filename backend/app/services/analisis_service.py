import logging
from sqlalchemy.orm import Session
from typing import List, Dict
from ..models import Animal, Corte, Costo, Precio
from ..sipsa.client import get_sipsa_bovino_prices
from ..sipsa.processor import (
    procesar_datos_sipsa,
    calcular_promedios_por_corte,
    generar_precio_sugerido,
    encontrar_key_sipsa,
)

logger = logging.getLogger(__name__)


def calcular_rendimiento_animal(animal: Animal):
    """Rendimiento del canal = peso_canal / peso_vivo * 100.

    Devuelve None si aún no se conoce el peso del canal: el rendimiento es un
    parámetro real medido tras el sacrificio, no un valor por defecto inventado.
    """
    if animal.peso_canal and animal.peso_vivo and animal.peso_vivo > 0:
        return round((animal.peso_canal / animal.peso_vivo) * 100, 2)
    return None


def calcular_costo_por_kg(animal: Animal, db: Session):
    """Costo directo por kg de canal (compra + costos asignados) / peso_canal.

    Devuelve None si no hay peso de canal registrado; no se fabrica un canal
    teórico a partir de un rendimiento supuesto.
    """
    if not animal.peso_canal or animal.peso_canal <= 0:
        return None
    costos = db.query(Costo).filter(Costo.animal_id == animal.id).all()
    costo_adicional = sum(c.valor for c in costos)
    return round((animal.precio_compra + costo_adicional) / animal.peso_canal, 2)


# Costos cuyo inductor reparte por peso puro (no por complejidad del corte).
INDUCTORES_POR_PESO = {"KG", "FIJO"}

# Factor de complejidad de proceso por tipo de corte (1.0 = corte promedio).
# Refleja cuánto trabajo de limpieza/porcionado exige el corte respecto al
# promedio; se asigna automáticamente según el nombre del corte para que el
# usuario no tenga que estimar un número.
FACTORES_COMPLEJIDAD = {
    "lomo_fino":  1.5,
    "lomo_aguja": 1.2,
    "punta_anca": 1.3,
    "cadera":     1.2,
    "bola_negra": 1.1,
    "muchacho":   1.2,
    "costilla":   1.0,
    "lagarto":    1.1,
    "pecho":      0.9,
    "brazo":      1.0,
    "molida":     0.8,
}


def factor_complejidad_corte(nombre: str) -> float:
    """Factor de complejidad asignado automáticamente a partir del nombre del
    corte. Devuelve 1.0 (promedio) si el corte no está en la tabla."""
    key = encontrar_key_sipsa(nombre or "")
    return FACTORES_COMPLEJIDAD.get(key, 1.0)


def calcular_costos_abc(animal: Animal, db: Session) -> Dict[int, Dict]:
    """Costeo ABC: distribuye el costo de las actividades entre los cortes.

    - Material (precio de compra): se reparte por participación en peso de los
      cortes vendibles, de modo que la merma del canal queda absorbida por los
      cortes aprovechables.
    - Actividades con inductor FIJO/KG: se reparten por peso.
    - Actividades con inductor de proceso (HORAS_HOMBRE, KWH, M3_REFRIG): se
      reparten por la base ponderada peso * factor_complejidad, para que los
      cortes más intensivos en proceso (limpieza, tipo de corte) absorban más.

    Retorna {corte_id: {costo_material, costo_actividades, costo_total, costo_unitario}}.
    """
    cortes = db.query(Corte).filter(Corte.animal_id == animal.id).all()
    if not cortes:
        return {}

    peso_total = sum(c.peso_kg or 0 for c in cortes)
    base_total = sum((c.peso_kg or 0) * (c.factor_complejidad or 1.0) for c in cortes)
    if peso_total <= 0 or base_total <= 0:
        return {}

    # Costos asignados al animal o al pool global (animal_id NULL).
    costos = db.query(Costo).filter(
        (Costo.animal_id == animal.id) | (Costo.animal_id.is_(None))
    ).all()
    costo_por_peso = sum(c.valor for c in costos if (c.inductor or "KG") in INDUCTORES_POR_PESO)
    costo_por_base = sum(c.valor for c in costos if (c.inductor or "KG") not in INDUCTORES_POR_PESO)

    resultado: Dict[int, Dict] = {}
    for corte in cortes:
        peso = corte.peso_kg or 0
        if peso <= 0:
            continue
        share_peso = peso / peso_total
        share_base = (peso * (corte.factor_complejidad or 1.0)) / base_total
        costo_material = animal.precio_compra * share_peso
        costo_actividades = costo_por_peso * share_peso + costo_por_base * share_base
        costo_total = costo_material + costo_actividades
        resultado[corte.id] = {
            "costo_material":    round(costo_material, 2),
            "costo_actividades": round(costo_actividades, 2),
            "costo_total":       round(costo_total, 2),
            "costo_unitario":    round(costo_total / peso, 2),
        }
    return resultado


def calcular_precios_cortes(animal_id: int, margen: float, db: Session) -> List[Dict]:
    animal = db.query(Animal).filter(Animal.id == animal_id).first()
    if not animal:
        return []
    costos_abc = calcular_costos_abc(animal, db)
    cortes = db.query(Corte).filter(Corte.animal_id == animal_id).all()
    df_sipsa = get_sipsa_bovino_prices()
    df_clean = procesar_datos_sipsa(df_sipsa)
    precios_sipsa = calcular_promedios_por_corte(df_clean)
    resultados = []
    for corte in cortes:
        abc = costos_abc.get(corte.id, {})
        costo_kg = abc.get("costo_unitario", 0.0)
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
        calc["costo_abc"] = abc
        corte.costo_unitario = costo_kg
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
    costos_por_kg  = [v for v in costos_por_kg if v and v > 0]
    costo_prom_kg  = sum(costos_por_kg) / len(costos_por_kg) if costos_por_kg else 0
    cortes_c       = [c for c in db.query(Corte).all() if c.margen_ganancia]
    margen_prom    = sum(c.margen_ganancia for c in cortes_c) / len(cortes_c) if cortes_c else 0
    return {
        "total_animales":    total_animales,
        "total_cortes":      total_cortes,
        "costo_promedio_kg": round(costo_prom_kg, 2),
        "margen_promedio":   round(margen_prom, 2),
    }
