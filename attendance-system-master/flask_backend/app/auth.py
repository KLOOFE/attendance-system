from functools import wraps

from flask import request, jsonify
from firebase_admin import auth, db


def require_teacher(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        # Get token from request
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            return jsonify({
                "success": False,
                "message": "Authentication token is missing"
            }), 401

        token = auth_header.split(" ", 1)[1]

        try:
            # Verify Firebase ID Token
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token["uid"]

            # Check teacher permission
            teacher = db.reference(f"teachers/{uid}").get()

            if teacher is not True:
                return jsonify({
                    "success": False,
                    "message": "Teacher access denied"
                }), 403

            request.current_user = decoded_token

            return f(*args, **kwargs)

        except Exception:
            return jsonify({
                "success": False,
                "message": "Invalid or expired authentication token"
            }), 401

    return decorated