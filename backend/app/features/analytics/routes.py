from fastapi import APIRouter
from app.features.analytics import service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def kpis():
    return service.get_kpis()


@router.get("/applications-by-status")
def by_status():
    return service.get_applications_by_status()


@router.get("/applications-by-zone")
def by_zone():
    return service.get_applications_by_zone()


@router.get("/surveyors")
def surveyors():
    return service.get_surveyor_workload()


@router.get("/geofeeds/parcels")
def parcels_geofeed():
    return service.get_parcels_geofeed()
