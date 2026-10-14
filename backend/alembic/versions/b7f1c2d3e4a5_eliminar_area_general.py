"""eliminar area General

Revision ID: b7f1c2d3e4a5
Revises: 479998aa6142
Create Date: 2026-10-08

Elimina el área "General" creada automáticamente por la migración 0e9329aceeac
como respaldo temporal. Como `tickets.area_id` es NOT NULL, los tickets que
quedaron asignados a "General" se eliminan (eran registros de prueba cerrados).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7f1c2d3e4a5'
down_revision: Union[str, Sequence[str], None] = '479998aa6142'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Elimina los tickets del área "General" y luego el área."""
    op.execute(
        "DELETE FROM tickets WHERE area_id IN (SELECT id FROM areas WHERE name = 'General')"
    )
    op.execute("DELETE FROM areas WHERE name = 'General'")


def downgrade() -> None:
    """Recrea el área "General" (sin reasignar tickets)."""
    op.execute(
        "INSERT INTO areas (name) SELECT 'General' "
        "WHERE NOT EXISTS (SELECT 1 FROM areas WHERE name = 'General')"
    )
