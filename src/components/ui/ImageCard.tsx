import { motion } from 'framer-motion'

interface ImageCardProps {
  image:       string
  title:       string
  subtitle?:   string
  description?: string
  selected?:   boolean
  locked?:     boolean
  onClick?:    () => void
  tags?:       string[]
  className?:  string
  children?:   React.ReactNode
  aspectRatio?: 'video' | 'square' | 'tall'
}

const ASPECT: Record<string, string> = {
  video:  'aspect-video',
  square: 'aspect-square',
  tall:   'aspect-[3/4]',
}

export function ImageCard({
  image,
  title,
  subtitle,
  description,
  selected  = false,
  locked    = false,
  onClick,
  tags,
  className = '',
  children,
  aspectRatio = 'video',
}: ImageCardProps) {
  return (
    <motion.div
      whileHover={!locked ? { scale: 1.02 } : {}}
      whileTap={!locked ? { scale: 0.98 } : {}}
      onClick={!locked ? onClick : undefined}
      className={[
        'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer',
        selected
          ? 'border-brand-500/80 shadow-glow-sm-red'
          : locked
            ? 'border-white/5 opacity-60 cursor-not-allowed'
            : 'border-white/10 hover:border-white/25',
        className,
      ].join(' ')}
    >
      {/* Image */}
      <div className={`relative ${ASPECT[aspectRatio]} overflow-hidden`}>
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{ filter: locked ? 'grayscale(40%)' : 'none' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/30 to-transparent" />

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center shadow-glow-sm-red">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Locked badge */}
        {locked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <span className="text-xs text-white/60 font-semibold">Próximamente</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="glass px-2.5 py-0.5 rounded-full text-xs font-semibold text-white/80">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-dark-800/90">
        {subtitle && (
          <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-1">
            {subtitle}
          </p>
        )}
        <h3 className="text-white font-bold text-base leading-tight">{title}</h3>
        {description && (
          <p className="text-white/50 text-sm mt-1.5 leading-relaxed line-clamp-2">{description}</p>
        )}
        {children}
      </div>
    </motion.div>
  )
}
