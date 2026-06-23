from fastapi import APIRouter, Query
from fastapi.responses import Response
from app.features.analytics import service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/kpis")
def kpis():
    return service.get_kpis()


@router.get("/applications-by-status")
def by_status():
    return service.get_applications_by_status()


@router.get("/applications-by-type")
def by_type():
    return service.get_applications_by_type()


@router.get("/applications-by-zone")
def by_zone():
    return service.get_applications_by_zone()


@router.get("/hotspots")
def hotspots(limit: int = 5):
    return service.get_hotspot_zones(limit)


@router.get("/delayed")
def delayed(threshold_days: int = 14):
    return service.get_delayed_applications(threshold_days)


@router.get("/backlog-by-age")
def backlog_by_age():
    return service.get_backlog_by_age()


@router.get("/applications-over-time")
def over_time():
    return service.get_applications_over_time()


@router.get("/processing-time")
def processing_time():
    return service.get_processing_time()


@router.get("/certificates-per-month")
def certificates_per_month():
    return service.get_certificates_per_month()


@router.get("/document-status")
def document_status():
    return service.get_document_status()


@router.get("/surveyors")
def surveyors():
    return service.get_surveyor_workload()


@router.get("/registrars")
def registrars():
    return service.get_registrar_workload()


@router.get("/geofeeds/parcels")
def parcels_geofeed():
    return service.get_parcels_geofeed()


@router.get("/geofeeds/applications")
def applications_geofeed():
    return service.get_applications_geofeed()


@router.get("/geofeeds/pending-heatmap")
def pending_heatmap():
    return service.get_pending_heatmap()


@router.get("/geofeeds/parcels-near")
def parcels_near(lng: float = Query(...), lat: float = Query(...), max_meters: int = 5000):
    return service.get_parcels_near(lng, lat, max_meters)


@router.get("/export/applications.csv")
def export_applications_csv():
    csv_text = service.export_applications_csv()
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=applications.csv"},
    )
