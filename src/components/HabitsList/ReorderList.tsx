import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRef } from "react";
import type { Habit } from "../../domain/Habit";
import { moveHabit } from "../../domain/habitOrder";
import { useMessages } from "../../i18n/i18n";
import { reorderListMessages } from "./messages";

const onlyVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });

/** The list while sorting: names only, each moved by its handle (pointer, touch or keyboard). */
export const ReorderList = ({
  habits,
  onChange,
}: {
  habits: Habit[];
  onChange: (habits: Habit[]) => void;
}) => {
  const sensors = useSensors(
    // A click on the handle isn't a drag; a few pixels of movement is.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const m = useMessages(reorderListMessages);

  const nameOf = (id: UniqueIdentifier) => habits.find((h) => h.id === id)?.name ?? "";
  const placeOf = (id: UniqueIdentifier) => m.place(habits.findIndex((h) => h.id === id) + 1, habits.length);
  // A drag starts over its own place; announcing that would talk over "Picked up".
  const lastPlace = useRef<UniqueIdentifier>(undefined);
  // The defaults read out internal ids; say the habit's name and place instead.
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      lastPlace.current = active.id;
      return m.pickedUp(nameOf(active.id), placeOf(active.id));
    },
    onDragOver: ({ active, over }) => {
      if (!over || over.id === lastPlace.current) return undefined;
      lastPlace.current = over.id;
      return m.moved(nameOf(active.id), placeOf(over.id));
    },
    onDragEnd: ({ active, over }) =>
      over ? m.dropped(nameOf(active.id), placeOf(over.id)) : m.notMoved(nameOf(active.id)),
    onDragCancel: ({ active }) => m.cancelled(nameOf(active.id)),
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over) onChange(moveHabit(habits, String(active.id), String(over.id)));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[onlyVertical]}
      accessibility={{ announcements, screenReaderInstructions: { draggable: m.instructions } }}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={habits.map((h) => h.id)} strategy={verticalListSortingStrategy}>
        <ul className="HabitsList-reorder" aria-label={m.list}>
          {habits.map((habit) => (
            <ReorderItem key={habit.id} habit={habit} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

const ReorderItem = ({ habit }: { habit: Habit }) => {
  const m = useMessages(reorderListMessages);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: habit.id });

  return (
    <li
      ref={setNodeRef}
      className={`HabitsList-reorder_item${isDragging ? " HabitsList-reorder_item-dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <span className="HabitsList-reorder_name">{habit.name}</span>
      {/* Only the handle drags, so the list still scrolls on a phone. */}
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="HabitsList-reorder_handle"
        {...attributes}
        {...listeners}
        aria-label={m.move(habit.name)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          {[5, 10, 15].flatMap((y) => [
            <circle key={`l${y}`} cx="7" cy={y} r="1.6" />,
            <circle key={`r${y}`} cx="13" cy={y} r="1.6" />,
          ])}
        </svg>
      </button>
    </li>
  );
};
