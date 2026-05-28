// загрузка и сохранение картинок. png/jpg через браузер, gb7 своим кодером

import { decodeGB7, encodeGB7 } from './gb7.js'

// формат по расширению
function formatFromName(name) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.gb7')) return 'gb7'
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg'
  return null
}

// рисуем png/jpg браузером и достаём imagedata
async function decodeBrowserImage(file, format) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = () => reject(new Error('Не удалось декодировать изображение'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    return {
      imageData,
      width: canvas.width,
      height: canvas.height,
      depth: 24,
      channels: 4,
      format,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// главная загрузка, отдаёт объект картинки (см App.jsx)
export async function loadImageFile(file) {
  const format = formatFromName(file.name)
  if (!format) {
    throw new Error('Неподдерживаемый формат файла. Используйте PNG, JPG или GB7.')
  }

  let image
  if (format === 'gb7') {
    const buffer = await file.arrayBuffer()
    image = decodeGB7(buffer)
  } else {
    image = await decodeBrowserImage(file, format)
  }

  image.fileName = file.name
  return image
}

// кодируем imagedata обратно в формат, отдаём blob
async function encodeToBlob(imageData, format) {
  if (format === 'gb7') {
    return encodeGB7(imageData)
  }

  // png/jpg снова через canvas
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')
  ctx.putImageData(imageData, 0, 0)

  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Ошибка кодирования'))),
      mime,
      0.92,
    )
  })
}

// меняем расширение на нужный формат
function fileNameForFormat(name, format) {
  const base = name.replace(/\.[^.]+$/, '')
  const ext = format === 'jpg' ? 'jpg' : format
  return base + '.' + ext
}

// сохраняем: кодируем и качаем через браузер
export async function saveImageFile(image, format) {
  const blob = await encodeToBlob(image.imageData, format)
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = fileNameForFormat(image.fileName || 'image', format)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  URL.revokeObjectURL(url)
}
