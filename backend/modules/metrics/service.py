from .repository import MetricsRepository

class MetricsService:
    def __init__(self, repository: MetricsRepository):
        self.repository = repository

    def get_tickets_per_month(self):
        rows = self.repository.tickets_per_month()
        return [{"year": int(r.year), "month": int(r.month), "total": r.total} for r in rows]

    def get_tickets_per_area(self):
        rows = self.repository.tickets_per_area()
        return [{"area": r.area, "total": r.total} for r in rows]

    def get_average_response_time(self):
        avg_hours, count = self.repository.average_response_time_hours()
        return {"average_hours": round(avg_hours, 2) if avg_hours else None, "resolved_tickets_count": count}