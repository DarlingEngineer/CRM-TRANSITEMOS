"""agregar solution a tickets y ticket_history"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2a1e0eb5d3f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tickets', sa.Column('solution', sa.Text(), nullable=True))
    op.add_column('ticket_history', sa.Column('solution', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('ticket_history', 'solution')
    op.drop_column('tickets', 'solution')