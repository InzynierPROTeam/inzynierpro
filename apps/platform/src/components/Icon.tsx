import type { SVGProps } from 'react'
import sprite from '~platform/styles/sprite.svg'
import type { IconName } from '~platform/types/icons'

export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: IconName
}) {
  return (
    <svg {...props}>
      <defs>
        <linearGradient
          id="paint0_linear_2220_2"
          x1="-2.5186"
          y1="-0.574903"
          x2="522.616"
          y2="520.612"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#297EFF" />
          <stop
            offset="1"
            stopColor="#615FFF"
          />
        </linearGradient>
        <clipPath id="clip0_2220_2">
          <rect
            width="512"
            height="512"
            rx="80"
            fill="white"
          />
        </clipPath>
      </defs>
      <use href={`${sprite}#${name}`} />
    </svg>
  )
}
