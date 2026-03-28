import logging
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..database.connection import get_db
from ..models.historico_sipsa import HistoricoSIPSA
from ..sipsa.client import get_sipsa_bovino_prices
from ..sipsa.processor import procesar_datos_sipsa, calcular_promedios_por_corte

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sipsa", tags=["SIPSA"])


@router.get("/consultar")
def consultar_sipsa(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
):
    try:
        df = get_sipsa_bovino_prices(fecha_inicio, fecha_fin)
        df_clean = procesar_datos_sipsa(df)
        return {
            "total":  len(df_clean),
            "datos":  df_clean.head(200).to_dict(orient="records"),
            "fuente": "DANE-SIPSA",
        }
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/guardar")
def guardar_sipsa(
    bg: BackgroundTasks,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
):
    bg.add_task(_guardar_bg, fecha_inicio, fecha_fin, db)
    return {"mensaje": "Actualizacion SIPSA iniciada en segundo plano"}


@router.get("/promedios")
def promedios_sipsa():
    df = get_sipsa_bovino_prices()
    df_clean = procesar_datos_sipsa(df)
    return calcular_promedios_por_corte(df_clean)


@router.get("/historico")
def historico_sipsa(skip: int = 0, limit: int = 200, db: Session = Depends(get_db)):
    return db.query(HistoricoSIPSA).offset(skip).limit(limit).all()


def _guardar_bg(fecha_inicio, fecha_fin, db: Session):
    try:
        df = get_sipsa_bovino_prices(fecha_inicio, fecha_fin)
        df_clean = procesar_datos_sipsa(df)
        for _, row in df_clean.iterrows():
            db.add(HistoricoSIPSA(
                producto=str(row.get("producto", "")),
                mercado=str(row.get("mercado", "")),
                ciudad=str(row.get("ciudad", "")),
                precio_promedio=float(row.get("precio_promedio", 0) or 0),
                precio_minimo=float(row.get("precio_minimo", 0) or 0),
                precio_maximo=float(row.get("precio_maximo", 0) or 0),
                unidad=str(row.get("unidad", "kg")),
                semana=str(row.get("semana", "")),
            ))
        db.commit()
        logger.info(f"SIPSA guardado: {len(df_clean)} registros.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error guardando SIPSA: {e}")
