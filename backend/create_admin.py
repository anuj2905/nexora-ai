"""Create or promote the first Nexora AI administrator.

Run from the backend folder: python create_admin.py
"""
from getpass import getpass
from uuid import uuid4
from sqlalchemy import select
from app.main import SessionLocal, User, password_hasher, migrate_database

def main() -> None:
    migrate_database()
    email = input("Administrator email: ").strip().lower()
    if "@" not in email:
        raise SystemExit("Enter a valid email address.")
    password = getpass("Administrator password (minimum 12 characters): ")
    confirm = getpass("Confirm password: ")
    if len(password) < 12:
        raise SystemExit("Password must contain at least 12 characters.")
    if password != confirm:
        raise SystemExit("Passwords do not match.")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(id=str(uuid4()), email=email,
                        password_hash=password_hasher.hash(password),
                        is_email_verified=True, role="admin")
            db.add(user)
        else:
            user.password_hash = password_hasher.hash(password)
            user.is_email_verified = True
            user.role = "admin"
        db.commit()
    print(f"Administrator account ready: {email}")

if __name__ == "__main__":
    main()
