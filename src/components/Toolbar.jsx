import { useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import FileOpenIcon from '@mui/icons-material/FileOpen'
import SaveIcon from '@mui/icons-material/Save'

// верхняя панель: открыть и сохранить
export default function TopToolbar({ onOpenFile, onSave, hasImage }) {
  const inputRef = useRef(null)
  const [menuAnchor, setMenuAnchor] = useState(null)

  function handlePick(e) {
    const file = e.target.files[0]
    if (file) onOpenFile(file)
    // сброс чтобы можно было открыть тот же файл снова
    e.target.value = ''
  }

  function handleSave(format) {
    setMenuAnchor(null)
    onSave(format)
  }

  return (
    <AppBar position="static">
      <Toolbar variant="dense">
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Технологии компьютерной графики Лабораторная 1
        </Typography>

        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gb7"
          style={{ display: 'none' }}
          onChange={handlePick}
        />

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<FileOpenIcon />}
            onClick={() => inputRef.current.click()}
          >
            Открыть
          </Button>

          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            disabled={!hasImage}
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            Сохранить
          </Button>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
          >
            <MenuItem onClick={() => handleSave('png')}>PNG</MenuItem>
            <MenuItem onClick={() => handleSave('jpg')}>JPG</MenuItem>
            <MenuItem onClick={() => handleSave('gb7')}>GB7</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
