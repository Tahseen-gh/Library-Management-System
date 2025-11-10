import { useTheme } from '@mui/material/styles';

export const Logo = ({ size = 500 }: { size?: number | string }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.dark;
  const secondaryColor = theme.palette.secondary.dark;

  return (
    <svg width={size} height={size} viewBox="0 0 400 280" fill="none">
      {/* Hourglass Icon */}
      <g transform="translate(200, 80)">
        {/* Top triangle */}
        <path
          d="M -24 -36 L 24 -36 L 0 0 Z"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinejoin="miter"
        />

        {/* Bottom triangle */}
        <path
          d="M 0 0 L -24 36 L 24 36 Z"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2"
          strokeLinejoin="miter"
        />

        {/* Sand in bottom - simple triangle */}
        <path
          d="M 0 8 L -16 36 L 16 36 Z"
          fill={secondaryColor}
          opacity="0.45"
        />

        {/* Top and bottom horizontal lines */}
        <line
          x1="-24"
          y1="-36"
          x2="24"
          y2="-36"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="-24"
          y1="36"
          x2="24"
          y2="36"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>

      {/* Text: Wayback */}
      <text
        x="200"
        y="180"
        textAnchor="middle"
        fill={primaryColor}
        fontSize="56"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="300"
        letterSpacing="-1.12"
      >
        Wayback
      </text>

      {/* Left line */}
      <line
        x1="80"
        y1="210"
        x2="128"
        y2="210"
        stroke="#CBD5E1"
        strokeWidth="1"
      />

      {/* Text: Public Library */}
      <text
        x="200"
        y="214"
        textAnchor="middle"
        fill="#64748B"
        fontSize="12"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="400"
        letterSpacing="2.4"
      >
        PUBLIC LIBRARY
      </text>

      {/* Right line */}
      <line
        x1="272"
        y1="210"
        x2="320"
        y2="210"
        stroke="#CBD5E1"
        strokeWidth="1"
      />
    </svg>
  );
};
