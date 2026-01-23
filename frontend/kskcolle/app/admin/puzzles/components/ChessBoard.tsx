"use client"

import React, { useEffect, useRef, useState } from "react"
import { Chess } from "chess.js"

interface ChessBoardProps {
  fen: string
  onFenChange?: (fen: string) => void
  onMove?: (from: string, to: string) => void
  draggable?: boolean
  orientation?: "white" | "black"
  highlightedSquares?: string[]
  errorSquare?: string | null // Square with an error indicator
  freePlacement?: boolean // If true, allow placing pieces anywhere without move validation
  showPiecePalette?: boolean // If true, show a palette to add new pieces
  customContentBeforePalette?: React.ReactNode // Custom content to render before the piece palette
}

// Unicode chess pieces
const PIECE_SYMBOLS: { [key: string]: string } = {
  'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
  'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
}

export default function ChessBoard({
  fen,
  onFenChange,
  onMove,
  draggable = true,
  orientation = "white",
  highlightedSquares = [],
  errorSquare = null,
  freePlacement = false,
  showPiecePalette = false,
  customContentBeforePalette
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [dragSquare, setDragSquare] = useState<string | null>(null)
  const [draggedOverSquare, setDraggedOverSquare] = useState<string | null>(null)
  const [validMoves, setValidMoves] = useState<string[]>([])
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [draggedPiece, setDraggedPiece] = useState<{ symbol: string; color: string } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  
  // Normalize FEN string to ensure it's valid (must have 6 space-delimited fields)
  const normalizeFen = (fenString: string): string => {
    if (!fenString || fenString.trim() === '') {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    
    const parts = fenString.trim().split(/\s+/)
    
    // FEN must have exactly 6 fields:
    // 1. Piece placement
    // 2. Active color (w or b)
    // 3. Castling availability
    // 4. En passant target square
    // 5. Halfmove clock
    // 6. Fullmove number
    
    // Ensure we have at least the piece placement
    if (parts.length === 0 || !parts[0]) {
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    }
    
    // Fill in missing fields with defaults
    const piecePlacement = parts[0] || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'
    const activeColor = parts[1] || 'w'
    const castling = parts[2] || '-'
    const enPassant = parts[3] || '-'
    const halfmoveClock = parts[4] || '0'
    const fullmoveNumber = parts[5] || '1'
    
    // Validate and fix move numbers
    let halfmove = parseInt(halfmoveClock, 10)
    if (isNaN(halfmove) || halfmove < 0) {
      halfmove = 0
    }
    
    let fullmove = parseInt(fullmoveNumber, 10)
    if (isNaN(fullmove) || fullmove < 1) {
      fullmove = 1
    }
    
    // Return normalized FEN with all 6 fields
    return `${piecePlacement} ${activeColor} ${castling} ${enPassant} ${halfmove} ${fullmove}`
  }
  
  const normalizedFen = normalizeFen(fen)
  const gameRef = useRef<Chess>(new Chess(normalizedFen))
  const hiddenDragImageRef = useRef<HTMLDivElement | null>(null)

  // Create a persistent hidden element for drag image
  useEffect(() => {
    if (!hiddenDragImageRef.current) {
      const hiddenDiv = document.createElement('div')
      hiddenDiv.id = 'chess-board-hidden-drag-image'
      hiddenDiv.style.position = 'absolute'
      hiddenDiv.style.top = '-9999px'
      hiddenDiv.style.left = '-9999px'
      hiddenDiv.style.width = '1px'
      hiddenDiv.style.height = '1px'
      hiddenDiv.style.opacity = '0'
      hiddenDiv.style.pointerEvents = 'none'
      hiddenDiv.style.visibility = 'hidden'
      hiddenDiv.style.border = 'none'
      hiddenDiv.style.background = 'transparent'
      hiddenDiv.style.zIndex = '-9999'
      document.body.appendChild(hiddenDiv)
      hiddenDragImageRef.current = hiddenDiv
    }
    
    return () => {
      // Clean up on unmount
      if (hiddenDragImageRef.current && document.body.contains(hiddenDragImageRef.current)) {
        document.body.removeChild(hiddenDragImageRef.current)
        hiddenDragImageRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    try {
      const normalized = normalizeFen(fen)
      gameRef.current.load(normalized)
    } catch (e) {
      console.error("Invalid FEN:", fen, e)
      // Try to load a default position if FEN is completely invalid
      try {
        gameRef.current.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
      } catch (e2) {
        console.error("Failed to load default position:", e2)
      }
    }
  }, [fen])

  const getSquareColor = (row: number, col: number): string => {
    // Calculate color based on the actual square position
    // Colors stay the same regardless of orientation - only rows/cols are flipped
    const isLight = (row + col) % 2 === 0
    return isLight ? '#f0d9b5' : '#b58863'
  }

  const getSquareName = (row: number, col: number): string => {
    const file = String.fromCharCode(97 + col) // a-h
    const rank = 8 - row // 1-8
    return `${file}${rank}`
  }

  const getPiece = (row: number, col: number): { symbol: string; color: string } | null => {
    const square = getSquareName(row, col)
    const piece = gameRef.current.get(square as any)
    if (!piece) return null
    
    const color = piece.color === 'w' ? 'w' : 'b'
    const type = piece.type.toUpperCase()
    const key = `${color}${type}`
    const symbol = PIECE_SYMBOLS[key]
    
    return symbol ? { symbol, color: piece.color } : null
  }

  const getValidMoves = (square: string): string[] => {
    if (freePlacement) return []
    try {
      const moves = gameRef.current.moves({ square: square as any, verbose: true })
      return moves.map((move: any) => move.to)
    } catch (e) {
      return []
    }
  }

  const handleSquareClick = (square: string) => {
    if (!draggable) return

    if (freePlacement) {
      // In free placement mode, just select/deselect squares
      if (selectedSquare === square) {
        setSelectedSquare(null)
        setValidMoves([])
        return
      }
      const piece = gameRef.current.get(square as any)
      if (piece) {
        setSelectedSquare(square)
        setValidMoves([])
      } else if (selectedSquare) {
        // Move piece from selected square to this empty square
        const fromPiece = gameRef.current.get(selectedSquare as any)
        if (fromPiece) {
          // Remove piece from source
          gameRef.current.remove(selectedSquare as any)
          // Place piece on target
          gameRef.current.put({ type: fromPiece.type, color: fromPiece.color }, square as any)
          const newFen = gameRef.current.fen()
          onFenChange?.(newFen)
          setSelectedSquare(null)
          setValidMoves([])
        }
      }
      return
    }

    // Normal mode with move validation
    if (selectedSquare === square) {
      setSelectedSquare(null)
      setValidMoves([])
      return
    }

    if (selectedSquare) {
      // Try to make move
      try {
        const move = gameRef.current.move({
          from: selectedSquare as any,
          to: square as any,
          promotion: 'q'
        })

        if (move) {
          const newFen = gameRef.current.fen()
          onFenChange?.(newFen)
          onMove?.(selectedSquare, square)
          setSelectedSquare(null)
          setValidMoves([])
        } else {
          // Invalid move, select new square if it has a piece
          const piece = gameRef.current.get(square as any)
          if (piece) {
            setSelectedSquare(square)
            setValidMoves(getValidMoves(square))
          } else {
            setSelectedSquare(null)
            setValidMoves([])
          }
        }
      } catch (e) {
        // Invalid move
        const piece = gameRef.current.get(square as any)
        if (piece) {
          setSelectedSquare(square)
          setValidMoves(getValidMoves(square))
        } else {
          setSelectedSquare(null)
          setValidMoves([])
        }
      }
    } else {
      const piece = gameRef.current.get(square as any)
      if (piece) {
        setSelectedSquare(square)
        setValidMoves(getValidMoves(square))
      }
    }
  }

  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (!draggable) {
      e.preventDefault()
      return
    }
    const piece = gameRef.current.get(square as any)
    if (piece) {
      const pieceSymbol = PIECE_SYMBOLS[`${piece.color === 'w' ? 'w' : 'b'}${piece.type.toUpperCase()}`]
      setDragSquare(square)
      setValidMoves(getValidMoves(square))
      setDraggedPiece({ symbol: pieceSymbol || '', color: piece.color })
      setDragPosition({ x: e.clientX, y: e.clientY })
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/x-chess-square', square)
      e.dataTransfer.setData('text/plain', square) // Fallback for some browsers
      
      // Use the persistent hidden element
      if (hiddenDragImageRef.current) {
        try {
          e.dataTransfer.setDragImage(hiddenDragImageRef.current, 0, 0)
        } catch (err) {
          // Fallback: create a new hidden element
          const dragImage = document.createElement('div')
          dragImage.style.position = 'absolute'
          dragImage.style.top = '-9999px'
          dragImage.style.left = '-9999px'
          dragImage.style.width = '1px'
          dragImage.style.height = '1px'
          dragImage.style.opacity = '0'
          dragImage.style.pointerEvents = 'none'
          dragImage.style.visibility = 'hidden'
          document.body.appendChild(dragImage)
          try {
            e.dataTransfer.setDragImage(dragImage, 0, 0)
          } catch (err2) {
            // Last resort: transparent image
            const emptyImg = new Image()
            emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
            e.dataTransfer.setDragImage(emptyImg, 0, 0)
          }
          setTimeout(() => {
            if (document.body.contains(dragImage)) {
              document.body.removeChild(dragImage)
            }
          }, 0)
        }
      }
    } else {
      e.preventDefault()
    }
  }
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragSquare) {
        setDragPosition({ x: e.clientX, y: e.clientY })
      }
    }

    const handleDragOver = (e: DragEvent) => {
      if (dragSquare && e.clientX && e.clientY) {
        setDragPosition({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      // Clean up on mouse up (in case dragEnd doesn't fire)
      if (dragSquare) {
        setDragSquare(null)
        setDragPosition(null)
        setDraggedPiece(null)
        setValidMoves([])
      }
    }

    if (dragSquare) {
      document.body.style.userSelect = 'none'
      
      // Use capture phase to ensure we catch events even if they're stopped
      document.addEventListener('mousemove', handleMouseMove, true)
      document.addEventListener('dragover', handleDragOver, true)
      document.addEventListener('mouseup', handleMouseUp, true)
      
      return () => {
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', handleMouseMove, true)
        document.removeEventListener('dragover', handleDragOver, true)
        document.removeEventListener('mouseup', handleMouseUp, true)
      }
    }
  }, [dragSquare])

  const handleDragOver = (e: React.DragEvent, square: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Update drag position during dragover
    if (dragSquare) {
      setDragPosition({ x: e.clientX, y: e.clientY })
    }
    
    if (freePlacement) {
      // In free placement mode, always allow drop
      // Check if it's from palette by looking at types
      const types = Array.from(e.dataTransfer.types)
      if (types.includes('piece')) {
        e.dataTransfer.dropEffect = 'copy' // From palette
      } else if (dragSquare) {
        e.dataTransfer.dropEffect = 'move' // From board
      } else {
        e.dataTransfer.dropEffect = 'move'
      }
      setDraggedOverSquare(square)
    } else {
      e.dataTransfer.dropEffect = 'move'
      if (dragSquare && dragSquare !== square) {
        setDraggedOverSquare(square)
      }
    }
  }

  const handleDragLeave = () => {
    setDraggedOverSquare(null)
  }

  const handleDrop = (e: React.DragEvent, targetSquare: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverSquare(null)
    
    if (!draggable) return

    // Check if dropping a piece from the palette first
    let pieceData = ''
    try {
      pieceData = e.dataTransfer.getData('piece')
    } catch (err) {
      // Some browsers don't support this
    }
    
    if (pieceData && freePlacement) {
      try {
        const { type, color } = JSON.parse(pieceData)
        // Remove existing piece if any
        gameRef.current.remove(targetSquare as any)
        // Place new piece
        gameRef.current.put({ type, color }, targetSquare as any)
        const newFen = gameRef.current.fen()
        onFenChange?.(newFen)
      } catch (err) {
        console.error("Error placing piece from palette:", err)
      }
      setDragSquare(null)
      setValidMoves([])
      return
    }

    // Check if we're dragging from the board
    const sourceSquare = dragSquare || e.dataTransfer.getData('application/x-chess-square') || e.dataTransfer.getData('text/plain')
    if (!sourceSquare) return

    if (freePlacement) {
      // In free placement mode, just move the piece without validation
      const piece = gameRef.current.get(sourceSquare as any)
      if (piece) {
        // If dropping on the same square, do nothing
        if (sourceSquare === targetSquare) {
          setDragSquare(null)
          return
        }
        
        // Remove piece from source
        gameRef.current.remove(sourceSquare as any)
        // Remove existing piece on target if any (this handles dropping on another piece)
        gameRef.current.remove(targetSquare as any)
        // Place piece on target
        gameRef.current.put({ type: piece.type, color: piece.color }, targetSquare as any)
        const newFen = gameRef.current.fen()
        onFenChange?.(newFen)
      }
      setDragSquare(null)
      setValidMoves([])
      return
    }

    // Normal mode with move validation
    try {
      const move = gameRef.current.move({
        from: sourceSquare as any,
        to: targetSquare as any,
        promotion: 'q'
      })

      if (move) {
        const newFen = gameRef.current.fen()
        onFenChange?.(newFen)
        onMove?.(sourceSquare, targetSquare)
        setValidMoves([])
      }
    } catch (err) {
      // Invalid move
      console.error("Invalid move:", err)
    }

    setDragSquare(null)
    setValidMoves([])
  }

  const handleDragEnd = (e: React.DragEvent) => {
    // Check if piece was dropped outside the board
    if (dragSquare && freePlacement) {
      const rect = boardRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX
        const y = e.clientY
        
        // Check if drop is outside board bounds
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          // Remove piece from board
          gameRef.current.remove(dragSquare as any)
          const newFen = gameRef.current.fen()
          onFenChange?.(newFen)
        }
      }
    }
    
    setDragSquare(null)
    setDraggedOverSquare(null)
    setValidMoves([])
    setDragPosition(null)
    setDraggedPiece(null)
  }

  const squares = []
  const rows = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const cols = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]

  for (let visualRow = 0; visualRow < 8; visualRow++) {
    for (let visualCol = 0; visualCol < 8; visualCol++) {
      const row = rows[visualRow]
      const col = cols[visualCol]
      const squareName = getSquareName(row, col)
      const isSelected = selectedSquare === squareName
      const isHighlighted = highlightedSquares.includes(squareName)
      const isDraggedOver = draggedOverSquare === squareName
      const piece = getPiece(row, col)
      const isDragging = dragSquare === squareName
      const hasError = errorSquare === squareName
      const isValidMove = validMoves.includes(squareName) && !piece && (selectedSquare || dragSquare)

      squares.push(
        <div
          key={squareName}
          className="relative flex items-center justify-center select-none"
          style={{
            backgroundColor: isHighlighted 
              ? '#f0f0a0' 
              : isDraggedOver
                ? '#baca44'
                : isSelected 
                  ? '#baca44' 
                  : getSquareColor(visualRow, visualCol),
            aspectRatio: '1',
            border: isSelected ? '3px solid #4a90e2' : 'none',
            cursor: draggable && piece ? 'grab' : draggable ? 'pointer' : 'default',
            transition: 'background-color 0.15s ease',
            boxSizing: 'border-box',
            position: 'relative',
            margin: 0,
            padding: 0,
            ...(draggable && piece ? { WebkitUserDrag: 'element' } : { WebkitUserDrag: 'none' }),
          } as React.CSSProperties & { WebkitUserDrag?: string }}
          onClick={() => handleSquareClick(squareName)}
          onDragStart={(e) => handleDragStart(e, squareName)}
          onDragOver={(e) => handleDragOver(e, squareName)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, squareName)}
          onDragEnd={(e) => handleDragEnd(e)}
          draggable={draggable && !!piece}
        >
          {piece && !isDragging && (
            <span 
              className="text-4xl sm:text-5xl md:text-6xl font-normal leading-none flex items-center justify-center"
              style={{ 
                userSelect: 'none',
                pointerEvents: 'none',
                lineHeight: '1',
                color: piece.color === 'w' ? '#ffffff' : '#1a1a1a',
                textShadow: piece.color === 'w' 
                  ? '2px 2px 3px rgba(0,0,0,0.7)' 
                  : '1px 1px 1px rgba(255,255,255,0.4)',
                WebkitTextStroke: piece.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : 'none',
                width: '100%',
                height: '100%',
                fontFamily: '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", Arial, sans-serif',
                fontFeatureSettings: 'normal',
                fontVariant: 'normal',
                fontVariantEmoji: 'none',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
              }}
            >
              {piece.symbol}
            </span>
          )}
          {isValidMove && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div
                className="w-4 h-4 rounded-full bg-gray-600 opacity-60"
                style={{
                  width: '25%',
                  height: '25%',
                }}
              />
            </div>
          )}
          {hasError && (
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-md"
              style={{
                transform: 'translate(25%, -25%)',
              }}
            >
              <span className="text-white text-xs font-bold leading-none" style={{ fontSize: '10px', lineHeight: '1' }}>×</span>
            </div>
          )}
        </div>
      )
    }
  }

  const handlePiecePaletteDragStart = (e: React.DragEvent, type: string, color: string) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('piece', JSON.stringify({ type, color }))
    e.dataTransfer.setData('text/plain', '') // Some browsers need this
  }

  const renderPiecePalette = () => {
    if (!showPiecePalette) return null

    const pieces = [
      { type: 'k', label: 'K', white: '♔', black: '♚' },
      { type: 'q', label: 'Q', white: '♕', black: '♛' },
      { type: 'r', label: 'R', white: '♖', black: '♜' },
      { type: 'b', label: 'B', white: '♗', black: '♝' },
      { type: 'n', label: 'N', white: '♘', black: '♞' },
      { type: 'p', label: 'P', white: '♙', black: '♟' },
    ]

    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <div className="text-sm font-semibold text-gray-700 mb-2">Voeg stukken toe:</div>
        <div className="flex flex-wrap gap-2">
          {pieces.map(piece => (
            <div
              key={`white-${piece.type}`}
              draggable
              onDragStart={(e) => handlePiecePaletteDragStart(e, piece.type, 'w')}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded flex items-center justify-center cursor-grab text-2xl hover:bg-gray-50 transition-colors"
              title={`Witte ${piece.label}`}
            >
              {piece.white}
            </div>
          ))}
          {pieces.map(piece => (
            <div
              key={`black-${piece.type}`}
              draggable
              onDragStart={(e) => handlePiecePaletteDragStart(e, piece.type, 'b')}
              className="w-12 h-12 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center cursor-grab text-2xl hover:bg-gray-700 transition-colors"
              title={`Zwarte ${piece.label}`}
            >
              <span style={{ color: '#ffffff' }}>{piece.black}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto" style={{ fontVariantEmoji: 'none' }}>
      {/* File labels (a-h) - top */}
      <div className="grid grid-cols-8 mb-1">
        {orientation === "white" 
          ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
              <div key={file} className="text-center text-xs sm:text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
          : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'].map(file => (
              <div key={file} className="text-center text-xs sm:text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
        }
      </div>
      
      <div className="flex items-stretch" style={{ minWidth: 0 }}>
        {/* Rank labels (1-8) - left */}
        <div className="flex flex-col mr-1 flex-shrink-0" style={{ width: 'auto' }}>
          {orientation === "white"
            ? [8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                <div key={rank} className="flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700" style={{ flex: '1 1 0', minHeight: 0 }}>
                  {rank}
                </div>
              ))
            : [1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                <div key={rank} className="flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700" style={{ flex: '1 1 0', minHeight: 0 }}>
                  {rank}
                </div>
              ))
          }
        </div>
        
        {/* Board */}
        <div 
          ref={boardRef}
          className="grid grid-cols-8 border-4 border-gray-800 shadow-xl flex-1"
          style={{ 
            aspectRatio: '1',
            boxSizing: 'border-box',
            width: '100%',
            minWidth: 0,
          }}
        >
          {squares}
        </div>
        
        {/* Rank labels (1-8) - right */}
        <div className="flex flex-col ml-1 flex-shrink-0" style={{ width: 'auto' }}>
          {orientation === "white"
            ? [8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                <div key={rank} className="flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700" style={{ flex: '1 1 0', minHeight: 0 }}>
                  {rank}
                </div>
              ))
            : [1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                <div key={rank} className="flex items-center justify-center text-xs sm:text-sm font-semibold text-gray-700" style={{ flex: '1 1 0', minHeight: 0 }}>
                  {rank}
                </div>
              ))
          }
        </div>
      </div>
      
      {/* File labels (a-h) - bottom */}
      <div className="grid grid-cols-8 mt-1">
          {orientation === "white" 
          ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
              <div key={file} className="text-center text-xs sm:text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
          : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'].map(file => (
              <div key={file} className="text-center text-xs sm:text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
        }
      </div>
      
      {/* Custom content before palette */}
      {customContentBeforePalette}
      
      {/* Piece Palette */}
      {renderPiecePalette()}
      
      {/* Dragged piece visual */}
      {dragPosition && draggedPiece && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: `${dragPosition.x}px`,
            top: `${dragPosition.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span 
            className="text-4xl sm:text-5xl md:text-6xl font-normal leading-none"
            style={{ 
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
              lineHeight: '1',
              color: draggedPiece.color === 'w' ? '#ffffff' : '#1a1a1a',
              textShadow: draggedPiece.color === 'w' 
                ? '2px 2px 3px rgba(0,0,0,0.7)' 
                : '1px 1px 1px rgba(255,255,255,0.4)',
              WebkitTextStroke: draggedPiece.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : 'none',
              opacity: 0.9,
              fontFamily: '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols", Arial, sans-serif',
              fontFeatureSettings: 'normal',
              fontVariant: 'normal',
              fontVariantEmoji: 'none',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
            }}
          >
            {draggedPiece.symbol}
          </span>
        </div>
      )}
    </div>
  )
}
