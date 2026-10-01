/**
 * RailwayTicketParser
 *
 * Extracts structured fields from raw OCR text output of railway travel documents.
 * Employs pattern recognition and regex heuristics designed for railway electronic tickets.
 */
export class RailwayTicketParser {
  /**
   * Parse extracted raw text into normalized railway ticket fields
   * @param {string} rawText
   * @returns {object} Extracted structured fields
   */
  static parse(rawText = '') {
    if (!rawText || typeof rawText !== 'string') {
      return {};
    }

    const text = rawText.replace(/\r\n/g, '\n');

    // 1. PNR extraction
    const pnrMatch =
      text.match(/PNR\s*(?:Number|No|#)?\s*[:\-]?\s*([A-Z0-9]{6,12})/i) ||
      text.match(/\b(PNR[A-Z0-9\-]{5,10})\b/i);
    const pnr = pnrMatch ? pnrMatch[1].trim() : null;

    // 2. Ticket Number extraction
    const ticketNoMatch = text.match(/Ticket\s*(?:No|Number|#)?\s*[:\-]?\s*([A-Z0-9\-]+)/i);
    const ticketNumber = ticketNoMatch ? ticketNoMatch[1].trim() : null;

    // 3. Passenger Name
    const nameMatch = text.match(/Passenger\s*(?:Name)?\s*[:\-]?\s*([A-Za-z\s\.\-]{3,40})/i);
    const passengerName = nameMatch ? nameMatch[1].trim() : null;

    // 4. Train Details
    const trainNoMatch =
      text.match(/Train\s*(?:No|Number|#)?\s*[:\-]?\s*(\d{3,5})/i) || text.match(/\((\d{3,5})\)/);
    const trainNumber = trainNoMatch ? trainNoMatch[1].trim() : null;

    const trainNameMatch =
      text.match(/Train\s*Name\s*[:\-]?\s*([A-Za-z\s]+?)(?:\s*\(\d+\)|\n|$)/i) ||
      text.match(/Train\s*[:\-]?\s*([A-Za-z\s]+?)(?:\n|$)/i);
    const trainName = trainNameMatch ? trainNameMatch[1].trim() : null;

    // 5. Stations (Source & Destination)
    const originMatch = text.match(
      /(?:Origin(?:\s*Station)?|From)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\s*\[[A-Z]+\]|\s+To|\n|$)/i
    );
    const source = originMatch ? originMatch[1].trim() : null;

    const destMatch = text.match(
      /(?:Destination(?:\s*Station)?|To)\s*[:\-]?\s*([A-Za-z\s]+?)(?:\s*\[[A-Z]+\]|\n|$)/i
    );
    const destination = destMatch ? destMatch[1].trim() : null;

    // 6. Journey Date & Departure Time
    const dateMatch =
      text.match(/Journey\s*Date\s*[:\-]?\s*(\d{1,4}[-\/][0-9A-Za-z]{2,3}[-\/]\d{2,4})/i) ||
      text.match(/Date\s*[:\-]?\s*(\d{1,4}[-\/][0-9A-Za-z]{2,3}[-\/]\d{2,4})/i);
    const journeyDate = dateMatch ? dateMatch[1].trim() : null;

    const depMatch =
      text.match(
        /(?:Scheduled\s*Departure\s*Time|Dep(?:arture)?\s*Time)\s*[:\-]?\s*(\d{1,2}:\d{2}(?:\s*[A-Z]{2,4})?)/i
      ) || text.match(/Time\s*[:\-]?\s*(\d{1,2}:\d{2})/i);
    const departureTime = depMatch ? depMatch[1].trim() : null;

    // 7. Coach, Seat, Class
    const coachMatch = text.match(/Coach\s*[:\-]?\s*([A-Za-z0-9\-]+)/i);
    const coach = coachMatch ? coachMatch[1].trim() : null;

    const seatMatch = text.match(
      /Seat(?:\s*No)?\s*[:\-]?\s*([A-Za-z0-9\s,\-]+?)(?:\s*Adult|\n|$)/i
    );
    const seat = seatMatch ? seatMatch[1].trim() : null;

    const classMatch = text.match(/Class\s*[:\-]?\s*([A-Za-z0-9\s\(\)\-]+?)(?:\n|Coach|$)/i);
    const seatClass = classMatch ? classMatch[1].trim() : null;

    // 8. Fare / Price
    const fareMatch = text.match(
      /(?:Ticket\s*Fare|Total\s*Amount|Fare)\s*[:\-]?\s*(?:BDT|Tk\.?)?\s*(\d+(?:\.\d{2})?)/i
    );
    const fare = fareMatch ? parseFloat(fareMatch[1]) : 0;

    return {
      ticketNumber: ticketNumber || pnr || null,
      pnr: pnr || null,
      passengerName: passengerName || null,
      trainName: trainName || null,
      trainNumber: trainNumber || null,
      source: source || null,
      destination: destination || null,
      journeyDate: journeyDate || null,
      departureTime: departureTime || null,
      coach: coach || null,
      seat: seat || null,
      class: seatClass || null,
      fare: isNaN(fare) ? 0 : fare,
    };
  }
}
