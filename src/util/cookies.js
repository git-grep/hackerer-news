function setCookie(name, value, expireSeconds) {
  var expires = ""
  if (expireSeconds) {
    var date = new Date()
    date.setTime(date.getTime() + expireSeconds * 1000)
    expires = "; expires=" + date.toUTCString()
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/"
}

function getCookie(name, defaultValue) {
  var nameEQ = name + "="
  var parts = document.cookie.split(';')
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i]
    while (part.charAt(0) === ' ') {
      part = part.substring(1)
    }
    if (part.startsWith(nameEQ)) {
      return part.substring(nameEQ.length)
    }
  }
  return defaultValue
}

function eraseCookie(name) {
  document.cookie = name + '=; Max-Age=-1;'
}

export {
  setCookie,
  getCookie,
  eraseCookie
}
