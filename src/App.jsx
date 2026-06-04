import { useState } from 'react'
import Box from '@mui/material/Box'
import TopToolbar from './components/Toolbar.jsx'
import ToolsPanel from './components/ToolsPanel.jsx'
import ImageCanvas from './components/ImageCanvas.jsx'
import StatusBar from './components/StatusBar.jsx'
import ChannelsPanel from './components/ChannelsPanel.jsx'
import LevelsDialog from './components/LevelsDialog.jsx'
import { loadImageFile, saveImageFile } from './imaging/imageIO.js'

const ALL_VISIBLE = { r: true, g: true, b: true, gray: true, a: true }

export default function App() {
  const [image, setImage] = useState(null)
  const [activeTool, setActiveTool] = useState('none')
  const [pickedPixel, setPickedPixel] = useState(null)
  const [channelVisibility, setChannelVisibility] = useState(ALL_VISIBLE)
  const [levelsOpen, setLevelsOpen] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  async function handleOpenFile(file) {
    try {
      const loaded = await loadImageFile(file)
      setImage(loaded)
      setPickedPixel(null)
      setChannelVisibility(ALL_VISIBLE)
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

  // применяем уровни результат становится новой картинкой
  function applyLevelsResult(data) {
    setImage((prev) => ({ ...prev, imageData: data }))
    setPreviewData(null)
  }

  // закрыть окно уровней и убрать предпросмотр
  function closeLevels() {
    setLevelsOpen(false)
    setPreviewData(null)
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopToolbar onOpenFile={handleOpenFile} onSave={handleSave} hasImage={Boolean(image)} />

      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex' }}>
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowY: 'auto',
          }}
        >
          <ToolsPanel
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            hasImage={Boolean(image)}
            onOpenLevels={() => setLevelsOpen(true)}
          />
          <ChannelsPanel
            image={image}
            visibility={channelVisibility}
            onToggle={toggleChannel}
          />
        </Box>

        <ImageCanvas
          image={image}
          visibility={channelVisibility}
          activeTool={activeTool}
          onPick={setPickedPixel}
          previewData={previewData}
        />
      </Box>

      <StatusBar image={image} pickedPixel={pickedPixel} />

      <LevelsDialog
        open={levelsOpen}
        image={image}
        onClose={closeLevels}
        onApply={applyLevelsResult}
        onPreview={setPreviewData}
      />
    </Box>
  )
}