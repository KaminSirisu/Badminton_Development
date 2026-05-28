function generateCheckInSlots(startTime) {
    if (!startTime) {
        throw new Error('Club startTime is missing');
    }

    const [hour, minute] = startTime.split(':').map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        throw new Error(`Invalid club startTime format: ${startTime}`);
    }

    const slots = [];

    for (let i=0; i<4; i++) {
        const totalMinutes = hour * 60 + (minute + (i * 30));
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;

        slots.push(
            `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        )
    }

    return slots;
}

export {
    generateCheckInSlots,
}
