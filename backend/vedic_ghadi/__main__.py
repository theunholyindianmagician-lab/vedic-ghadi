"""Entry-point so `python -m vedic_ghadi` works without install."""
from .cli import main
import sys

if __name__ == "__main__":
    sys.exit(main())
