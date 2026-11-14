import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, db
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from app.routes.students import students_bp


def create_app():
    app = Flask(__name__)

    # Enable CORS for local frontend
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://127.0.0.1:5500",
                    "http://localhost:5500"
                ]
            }
        }
    )

    # Load environment variables
    load_dotenv()

    # Firebase configuration
    service_account_path = Path(
        os.getenv("FIREBASE_SERVICE_ACCOUNT", "")
    ).resolve()

    database_url = "https://fainla-db-default-rtdb.firebaseio.com"

    # Initialize Firebase Admin SDK
    if not firebase_admin._apps:
        if not service_account_path.exists():
            raise FileNotFoundError(
                "Firebase service account file was not found."
            )

        credential = credentials.Certificate(
            str(service_account_path)
        )

        firebase_admin.initialize_app(
            credential,
            {"databaseURL": database_url}
        )

    # Register API routes
    app.register_blueprint(students_bp)

    @app.route("/")
    def home():
        return {
            "success": True,
            "message": "Attendance System Flask Backend is running"
        }, 200

    @app.route("/api/firebase-status")
    def firebase_status():
        try:
            db.reference("/").get()

            return {
                "success": True,
                "firebase": "connected"
            }, 200

        except Exception:
            app.logger.exception("Firebase connection failed")

            return {
                "success": False,
                "firebase": "disconnected"
            }, 500

    return app