export function initials(n = "") {
  return n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

export function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}

export function weekDays() {
  const days = ["L", "M", "X", "J", "V", "S", "D"]
  const hoy = new Date()
  const dow = hoy.getDay()
  const lun = new Date(hoy)
  lun.setDate(hoy.getDate() - ((dow + 6) % 7))
  return days.map((l, i) => {
    const d = new Date(lun)
    d.setDate(lun.getDate() + i)
    return { letter: l, num: d.getDate(), date: d }
  })
}
