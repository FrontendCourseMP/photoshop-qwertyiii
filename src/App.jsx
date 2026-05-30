import { useState } from 'react'
import Box from '@mui/material/Box'
import TopToolbar from './components/Toolbar.jsx'
import ImageCanvas from './components/ImageCanvas.jsx'
import StatusBar from './components/StatusBar.jsx'
import ChannelsPanel from './components/ChannelsPanel.jsx'
import { loadImageFile, saveImageFile } from './imaging/imageIO.js'

// все каналы видимы по умолчанию
const ALL_VISIBLE = { r: true, g: true, b: true, gray: true, a: true }

export default function App() {
  const [image, setImage] = useState(null)
  const [activeTool, setActiveTool] = useState('none')
  const [pickedPixel, setPickedPixel] = useState(null)
  const [channelVisibility, setChannelVisibility] = useState(ALL_VISIBLE)

  async function handleOpenFile(file) {
    try {
      const loaded = await loadImageFile(file)
      setImage(loaded)
      setPickedPixel(null)
      setChannelVisibility(ALL_VISIBLE) // сбрасываем каналы при новой картинке
    } catch (err) {
      alert('Не удалось открыть файл: ' + err.message)
    }
  }

  async function handleSave(format) {
    if (!image) return
    try {
      await saveImageFile(image, format)
    } catch (err) {
      alert('Не удалось сохранить файл: ' + err.message)
    }
  }

  function toggleChannel(key) {
    setChannelVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopToolbar
        onOpenFile={handleOpenFile}
        onSave={handleSave}
        hasImage={Boolean(image)}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
      />
      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}>
        <ChannelsPanel
          image={image}
          visibility={channelVisibility}
          onToggle={toggleChannel}
        />
        <ImageCanvas
          image={image}
          visibility={channelVisibility}
          activeTool={activeTool}
          onPick={setPickedPixel}
        />
      </Box>
      <StatusBar image={image} pickedPixel={pickedPixel} />
    </Box>
  )
}