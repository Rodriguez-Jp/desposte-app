import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from ..database.connection import get_db
from ..sipsa.client import get_sipsa_bovino_prices
from ..sipsa.processor import procesar_datos_sipsa, calcular_promedios_por_corte
from ..dependencies.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sipsa", tags=["SIPSA"], dependencies=[Depends(get_current_user)])


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


@router.get("/promedios")
def promedios_sipsa():
    df = get_sipsa_bovino_prices()
    df_clean = procesar_datos_sipsa(df)
    return calcular_promedios_por_corte(df_clean)
