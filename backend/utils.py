import uuid

def generate_room_key() -> str:
    """Generate a unique room key using UUID4."""
    return str(uuid.uuid4())
