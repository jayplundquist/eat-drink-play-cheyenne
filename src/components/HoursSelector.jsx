import React from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Generate hours for time picker (00:00 to 23:30)
const generateHours = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const hour = String(i).padStart(2, '0');
      const min = String(j).padStart(2, '0');
      const time12 = new Date(2000, 0, 1, i, j).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      hours.push({ value: `${hour}:${min}`, label: time12 });
    }
  }
  return hours;
};

const ALL_HOURS = generateHours();

export default function HoursSelector({ value, onChange }) {
  // Initialize with default hours if empty
  const hours = value || {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  };

  const updateDay = (day, field, timeValue) => {
    const updated = { ...hours };
    if (!updated[day]) {
      updated[day] = { open: null, close: null };
    }
    updated[day][field] = timeValue;
    onChange(updated);
  };

  const toggleClosed = (day) => {
    const updated = { ...hours };
    if (updated[day] === null) {
      updated[day] = { open: '09:00', close: '17:00' };
    } else {
      updated[day] = null;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Business Hours</Label>
      <div className="space-y-2">
        {DAYS.map((day, idx) => {
          const dayHours = hours[day];
          const isClosed = dayHours === null;

          return (
            <Card key={day} className="p-4 bg-white border-stone-200">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-[150px]">
                  <span className="font-medium text-stone-700 w-24">{DAY_LABELS[idx]}</span>
                  <Badge
                    variant={isClosed ? 'destructive' : 'secondary'}
                    className={isClosed ? 'bg-stone-300 text-stone-700' : 'bg-green-100 text-green-800'}
                  >
                    {isClosed ? 'Closed' : 'Open'}
                  </Badge>
                </div>

                {!isClosed && (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-600">Open:</span>
                      <Select
                        value={dayHours.open || ''}
                        onValueChange={(val) => updateDay(day, 'open', val)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_HOURS.map(h => (
                            <SelectItem key={h.value} value={h.value}>
                              {h.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-stone-600">Close:</span>
                      <Select
                        value={dayHours.close || ''}
                        onValueChange={(val) => updateDay(day, 'close', val)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_HOURS.map(h => (
                            <SelectItem key={h.value} value={h.value}>
                              {h.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => toggleClosed(day)}
                  className="text-sm text-amber-600 hover:text-amber-700 hover:underline font-medium"
                >
                  {isClosed ? 'Mark Open' : 'Mark Closed'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}