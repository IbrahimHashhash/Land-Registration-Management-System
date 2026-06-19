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


@router.get("/applications-over-time")
def over_time():
    return service.get_applications_over_time()


@router.get("/processing-time")
def processing_time():
    return service.get_processing_time()


@router.get("/certificates-per-month")
def certificates_per_month():
    return service.get_certificates_per_month()


@router.get("/surveyors")
def surveyors():
    return service.get_surveyor_workload()


@router.get("/geofeeds/parcels")
def parcels_geofeed():
    return service.get_parcels_geofeed()


@router.get("/geofeeds/applications")
def applications_geofeed():
    return service.get_applications_geofeed()
