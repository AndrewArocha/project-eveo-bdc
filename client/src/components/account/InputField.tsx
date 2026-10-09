interface InputFieldProps {
  label: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}

export default function InputField({ label, defaultValue, type = "text", disabled = false }: InputFieldProps) {
  return (
    <div className="flex flex-col relative group">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 transition-colors group-focus-within:text-orange-500">
        {label}
      </label>
      <div className="relative">
        <input 
          type={type} 
          defaultValue={defaultValue} 
          disabled={disabled} 
          className="w-full bg-transparent border-b border-gray-300 dark:border-white/20 py-2 text-base font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
        />
        {!disabled && (
          <div className="absolute -bottom-px left-0 h-0.5 w-0 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
        )}
      </div>
    </div>
  );
}