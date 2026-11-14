from flask import Blueprint, jsonify
from firebase_admin import db

from app.auth import require_teacher


students_bp = Blueprint("students", __name__)


@students_bp.route("/api/students", methods=["GET"])
@require_teacher
def get_students():
    try:
        students = db.reference("students").get()

        if not students:
            students = {}

        return jsonify({
            "success": True,
            "count": len(students),
            "students": students
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "message": "Failed to retrieve students"
        }), 500