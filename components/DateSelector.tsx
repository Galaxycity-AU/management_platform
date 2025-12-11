import { useRef, useState } from 'react';

export default function DateSelector({ dates, selectedDate, onDateSelect, isToday, getDayName, getDateNumber }) {
  const dateScrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - dateScrollRef.current.offsetLeft);
    setScrollLeft(dateScrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - dateScrollRef.current.offsetLeft;
    const walk = (x - startX) * 0.8; // Reduced multiplier for slower scrolling
    
    // Only mark as moved if dragged more than 5 pixels
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    dateScrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleDateClick = (date, e) => {
    // Only trigger date selection if we didn't drag significantly
    if (!hasMoved) {
      onDateSelect(date);
    }
  };

  const isSelectedDate = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div 
        ref={dateScrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`overflow-x-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex">
          {dates.map((date, idx) => (
            <button
              key={`${date.getTime()}-${idx}`}
              onClick={(e) => handleDateClick(date, e)}
              className={`flex-shrink-0 w-16 text-center py-2 border-r border-gray-200 transition select-none ${
                !isDragging ? 'hover:bg-gray-100' : ''
              } ${
                isSelectedDate(date) ? 'bg-blue-500 text-white hover:bg-blue-600' : 
                isToday(date) ? 'bg-blue-100 text-blue-900' : 'bg-white'
              }`}
            >
              <div className="text-xs font-medium">{getDayName(date)}</div>
              <div className="text-xl font-semibold">{getDateNumber(date)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}