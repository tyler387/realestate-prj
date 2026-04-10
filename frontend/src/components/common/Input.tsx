type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = ({ className = '', ...props }: InputProps) => (
  <input
    className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 ${className}`}
    {...props}
  />
)
