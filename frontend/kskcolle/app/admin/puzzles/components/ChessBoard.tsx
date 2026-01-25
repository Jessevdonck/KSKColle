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

// SVG Chess Pieces - consistent rendering across all platforms
const ChessPieceSVG = ({ type, color, className }: { type: string; color: 'w' | 'b'; className?: string }) => {
  const isWhite = color === 'w'
  const fill = isWhite ? '#fff' : '#000'
  const stroke = isWhite ? '#000' : '#fff'
  const strokeWidth = 1.5
  
  const pieces: { [key: string]: JSX.Element } = {
    k: ( // King
      <svg viewBox="0 0 45 45" className={className}>
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6M20 8h5" strokeWidth="1.5" fill="none"/>
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill={fill} stroke={stroke} strokeLinecap="butt" strokeLinejoin="miter"/>
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" fill={fill}/>
          <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none"/>
        </g>
      </svg>
    ),
    q: ( // Queen
      <svg viewBox="0 0 45 45" className={className}>
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.75"/>
          <circle cx="14" cy="9" r="2.75"/>
          <circle cx="22.5" cy="8" r="2.75"/>
          <circle cx="31" cy="9" r="2.75"/>
          <circle cx="39" cy="12" r="2.75"/>
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-3.5-7-5.5 9.5-5.5-9.5-3.5 7-7.5-11.5L9 26z" strokeLinecap="butt"/>
          <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" strokeLinecap="butt"/>
          <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none"/>
        </g>
      </svg>
    ),
    r: ( // Rook
      <svg viewBox="0 0 45 45" className={className}>
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" strokeLinecap="butt"/>
          <path d="M34 14l-3 3H14l-3-3"/>
          <path d="M31 17v12.5H14V17" strokeLinecap="butt" strokeLinejoin="miter"/>
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
          <path d="M11 14h23" fill="none" strokeLinejoin="miter"/>
        </g>
      </svg>
    ),
    b: ( // Bishop
      <svg viewBox="0 0 45 45" className={className}>
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <g strokeLinecap="butt">
            <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z"/>
            <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z"/>
            <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z"/>
          </g>
          <path d="M17.5 26h10M15 30h15m-7.5-14.5v5M20 18h5" fill="none" stroke={isWhite ? stroke : '#fff'} strokeLinejoin="miter"/>
        </g>
      </svg>
    ),
    n: ( // Knight
      <svg viewBox="0 0 45 45" className={className}>
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill={fill}/>
          <path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" fill={fill}/>
          <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 1 1 1 0z" fill={isWhite ? stroke : '#fff'}/>
          <path d="M14.933 15.75a.5 1.5 30 1 1-.866-.5.5 1.5 30 1 1 .866.5z" fill={isWhite ? stroke : '#fff'}/>
        </g>
      </svg>
    ),
    p: ( // Pawn
      <svg viewBox="0 0 45 45" className={className}>
        <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"/>
      </svg>
    ),
  }
  
  if (!type) return null
  return pieces[type.toLowerCase()] || null
}

// Legacy mapping for compatibility
const PIECE_SYMBOLS: { [key: string]: string } = {
  'wK': 'K', 'wQ': 'Q', 'wR': 'R', 'wB': 'B', 'wN': 'N', 'wP': 'P',
  'bK': 'K', 'bQ': 'Q', 'bR': 'R', 'bB': 'B', 'bN': 'N', 'bP': 'P'
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
  const [draggedPiece, setDraggedPiece] = useState<{ symbol: string; color: string; type: string } | null>(null)
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

  const getPiece = (row: number, col: number): { symbol: string; color: string; type: string } | null => {
    const square = getSquareName(row, col)
    const piece = gameRef.current.get(square as any)
    if (!piece) return null
    
    const color = piece.color === 'w' ? 'w' : 'b'
    const type = piece.type.toUpperCase()
    const key = `${color}${type}`
    const symbol = PIECE_SYMBOLS[key]
    
    return symbol ? { symbol, color: piece.color, type: piece.type } : null
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
      setDraggedPiece({ symbol: pieceSymbol || '', color: piece.color, type: piece.type })
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
            <div 
              className="w-[85%] h-[85%] flex items-center justify-center"
              style={{ 
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              <ChessPieceSVG 
                type={piece.type} 
                color={piece.color as 'w' | 'b'} 
                className="w-full h-full drop-shadow-md"
              />
            </div>
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

    const pieceTypes = ['k', 'q', 'r', 'b', 'n', 'p']
    const pieceLabels: { [key: string]: string } = { k: 'Koning', q: 'Dame', r: 'Toren', b: 'Loper', n: 'Paard', p: 'Pion' }

    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <div className="text-sm font-semibold text-gray-700 mb-2">Voeg stukken toe:</div>
        <div className="flex flex-wrap gap-2">
          {pieceTypes.map(type => (
            <div
              key={`white-${type}`}
              draggable
              onDragStart={(e) => handlePiecePaletteDragStart(e, type, 'w')}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded flex items-center justify-center cursor-grab hover:bg-gray-50 transition-colors p-1"
              title={`Witte ${pieceLabels[type]}`}
            >
              <ChessPieceSVG type={type} color="w" className="w-full h-full" />
            </div>
          ))}
          {pieceTypes.map(type => (
            <div
              key={`black-${type}`}
              draggable
              onDragStart={(e) => handlePiecePaletteDragStart(e, type, 'b')}
              className="w-12 h-12 bg-gray-800 border-2 border-gray-600 rounded flex items-center justify-center cursor-grab hover:bg-gray-700 transition-colors p-1"
              title={`Zwarte ${pieceLabels[type]}`}
            >
              <ChessPieceSVG type={type} color="b" className="w-full h-full" />
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
            width: '60px',
            height: '60px',
            opacity: 0.9,
          }}
        >
          <ChessPieceSVG 
            type={draggedPiece.type} 
            color={draggedPiece.color as 'w' | 'b'} 
            className="w-full h-full drop-shadow-lg"
          />
        </div>
      )}
    </div>
  )
}
