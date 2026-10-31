from app.entities import PasswordResetToken
from app.repositories.base_repository import BaseRepository


class PasswordResetTokenRepository(BaseRepository):
    entity = PasswordResetToken

    def find_by_token(self, token, for_update=False):
        return self._fetch_one("token = %s", (token,), for_update)
