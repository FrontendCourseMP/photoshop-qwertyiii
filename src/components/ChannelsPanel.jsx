import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getChannels, makeThumbnails } from '../imaging/channels.js'

// подписи каналов
const LABELS = { r: 'R', g: 'G', b: 'B', gray: 'Серый', a: 'Альфа' }

export default function ChannelsPanel({ image, visibility, onToggle }) {
  const [thumbs, setThumbs] = useState({})

  // превью при смене картинки
  useEffect(() => {
    if (!image) {
      setThumbs({})
      return
    }
    setThumbs(makeThumbnails(image.imageData, getChannels(image)))
  }, [image])

  if (!image) return null

  const channels = getChannels(image)

  return (
    <Box sx={{ p: 1.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Каналы
      </Typography>

      {channels.map((key) => {
        const on = visibility[key]
        return (
          <Box
            key={key}
            onClick={() => onToggle(key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 0.5,
              mb: 0.5,
              borderRadius: 1,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: on ? 'primary.main' : 'transparent',
              opacity: on ? 1 : 0.4,
            }}
          >
            {thumbs[key] && (
              <Box
                component="img"
                src={thumbs[key]}
                alt={key}
                sx={{ width: 48, height: 48, borderRadius: 0.5, display: 'block' }}
              />
            )}
            <Typography variant="body2">{LABELS[key]}</Typography>
          </Box>
        )
      })}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Нажмите на канал, чтобы включить или выключить его
      </Typography>
    </Box>
  )
}