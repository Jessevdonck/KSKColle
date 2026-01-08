"use client"

import { useEffect, useRef, useState } from "react"
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
  showPiecePalette = false
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)
  const [dragSquare, setDragSquare] = useState<string | null>(null)
  const [draggedOverSquare, setDraggedOverSquare] = useState<string | null>(null)
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
    const isLight = (row + col) % 2 === 0
    return isLight ? '#f0d9b5' : '#b58863'
  }

  const getSquareBorder = (row: number, col: number): string => {
    // Add subtle borders between squares for better definition
    const isLight = (row + col) % 2 === 0
    return 'none'
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

  const handleSquareClick = (square: string) => {
    if (!draggable) return

    if (freePlacement) {
      // In free placement mode, just select/deselect squares
      if (selectedSquare === square) {
        setSelectedSquare(null)
        return
      }
      const piece = gameRef.current.get(square as any)
      if (piece) {
        setSelectedSquare(square)
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
        }
      }
      return
    }

    // Normal mode with move validation
    if (selectedSquare === square) {
      setSelectedSquare(null)
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
        } else {
          // Invalid move, select new square if it has a piece
          const piece = gameRef.current.get(square as any)
          setSelectedSquare(piece ? square : null)
        }
      } catch (e) {
        // Invalid move
        const piece = gameRef.current.get(square as any)
        setSelectedSquare(piece ? square : null)
      }
    } else {
      const piece = gameRef.current.get(square as any)
      if (piece) {
        setSelectedSquare(square)
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
      setDragSquare(square)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/x-chess-square', square)
      e.dataTransfer.setData('text/plain', square) // Fallback for some browsers
    } else {
      e.preventDefault()
    }
  }

  const handleDragOver = (e: React.DragEvent, square: string) => {
    e.preventDefault()
    e.stopPropagation()
    
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
      }
    } catch (err) {
      // Invalid move
      console.error("Invalid move:", err)
    }

    setDragSquare(null)
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
  }

  const squares = []
  const rows = orientation === "white" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]

  for (let row of rows) {
    for (let col = 0; col < 8; col++) {
      const squareName = getSquareName(row, col)
      const isSelected = selectedSquare === squareName
      const isHighlighted = highlightedSquares.includes(squareName)
      const isDraggedOver = draggedOverSquare === squareName
      const piece = getPiece(row, col)
      const isDragging = dragSquare === squareName
      const hasError = errorSquare === squareName

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
                  : getSquareColor(row, col),
            width: '100%',
            height: '100%',
            aspectRatio: '1',
            border: isSelected ? '3px solid #4a90e2' : 'none',
            cursor: draggable && piece ? 'grab' : draggable ? 'pointer' : 'default',
            WebkitUserDrag: draggable && piece ? 'element' : 'none' as any,
            transition: 'background-color 0.15s ease',
            opacity: isDragging ? 0.3 : 1,
            boxSizing: 'border-box',
            position: 'relative',
            margin: 0,
            padding: 0,
          }}
          onClick={() => handleSquareClick(squareName)}
          onDragStart={(e) => handleDragStart(e, squareName)}
          onDragOver={(e) => handleDragOver(e, squareName)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, squareName)}
          onDragEnd={(e) => handleDragEnd(e)}
          draggable={draggable && !!piece}
        >
          {piece && (
            <span 
              className="text-5xl md:text-6xl font-normal leading-none"
              style={{ 
                userSelect: 'none',
                pointerEvents: 'none',
                display: 'block',
                lineHeight: '1',
                color: piece.color === 'w' ? '#ffffff' : '#1a1a1a',
                textShadow: piece.color === 'w' 
                  ? '2px 2px 3px rgba(0,0,0,0.7)' 
                  : '1px 1px 1px rgba(255,255,255,0.4)',
                WebkitTextStroke: piece.color === 'w' ? '0.5px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {piece.symbol}
            </span>
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
    <div className="w-full max-w-2xl mx-auto">
      {/* File labels (a-h) - top */}
      <div className="grid grid-cols-8 mb-1">
        {orientation === "white" 
          ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
              <div key={file} className="text-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
          : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'].map(file => (
              <div key={file} className="text-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
        }
      </div>
      
      <div className="flex">
        {/* Rank labels (1-8) - left */}
        <div className="flex flex-col-reverse mr-1 justify-center">
          {orientation === "white"
            ? [1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                <div key={rank} className="flex items-center justify-center text-sm font-semibold text-gray-700" style={{ height: '12.5%', aspectRatio: '1' }}>
                  {rank}
                </div>
              ))
            : [8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                <div key={rank} className="flex items-center justify-center text-sm font-semibold text-gray-700" style={{ height: '12.5%', aspectRatio: '1' }}>
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
            height: '100%',
          }}
        >
          {squares}
        </div>
        
        {/* Rank labels (1-8) - right */}
        <div className="flex flex-col-reverse ml-1 justify-center">
          {orientation === "white"
            ? [1, 2, 3, 4, 5, 6, 7, 8].map(rank => (
                <div key={rank} className="flex items-center justify-center text-sm font-semibold text-gray-700" style={{ height: '12.5%', aspectRatio: '1' }}>
                  {rank}
                </div>
              ))
            : [8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                <div key={rank} className="flex items-center justify-center text-sm font-semibold text-gray-700" style={{ height: '12.5%', aspectRatio: '1' }}>
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
              <div key={file} className="text-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
          : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'].map(file => (
              <div key={file} className="text-center text-sm font-semibold text-gray-700">
                {file}
              </div>
            ))
        }
      </div>
      
      {/* Piece Palette */}
      {renderPiecePalette()}
    </div>
  )
}
