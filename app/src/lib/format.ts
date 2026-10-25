const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtShort = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const fmtLong = (d: Date) => `${d.getDate()} ${FULL[d.getMonth()]} ${d.getFullYear()}`;
