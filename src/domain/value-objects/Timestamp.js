export class Timestamp {
  constructor(value = Date.now()) {
    this.value = Number(value);

    if (isNaN(this.value) || this.value < 0) {
      throw new Error('Timestamp must be a valid positive number');
    }
  }

  isOlderThan(other) {
    if (!(other instanceof Timestamp)) {
      other = new Timestamp(other);
    }
    return this.value < other.value;
  }

  isNewerThan(other) {
    if (!(other instanceof Timestamp)) {
      other = new Timestamp(other);
    }
    return this.value > other.value;
  }

  subtract(milliseconds) {
    return new Timestamp(this.value - milliseconds);
  }

  add(milliseconds) {
    return new Timestamp(this.value + milliseconds);
  }

  equals(other) {
    return other instanceof Timestamp && this.value === other.value;
  }

  toString() {
    return this.value.toString();
  }

  toDate() {
    return new Date(this.value);
  }
}
