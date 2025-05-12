import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlarmClock, Plus, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EventFormDialog({ open, onOpenChange, onSubmit, isPending, form, today, tomorrow, nextWeek, onQuickAdd }) {
  const { t } = useLanguage();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> {t('calendarAdd')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white border border-blue-100 shadow-md rounded-lg">
        <DialogHeader className="pb-3 border-b border-blue-100">
          <DialogTitle className="text-blue-900 font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {t('calendarAddNew')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-900 font-medium">{t('calendarWhatsDue')}</FormLabel>
                <FormControl>
                  <Input 
                    className="focus:border-blue-300 focus:ring-2 focus:ring-blue-100 bg-white border-blue-200 placeholder-blue-300 text-blue-900" 
                    placeholder={t('calendarTitlePlaceholder')} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="startDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-900 font-medium">{t('calendarDueDate')}</FormLabel>
                <FormControl>
                  <div className="relative">
                    <AlarmClock className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-400" />
                    <Input 
                      className="focus:border-blue-300 focus:ring-2 focus:ring-blue-100 bg-white border-blue-200 pl-9 text-blue-900" 
                      type="datetime-local" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )} />
            
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-blue-900 font-medium">{t('calendarNotes')}</FormLabel>
                <FormControl>
                  <Textarea 
                    className="resize-none h-20 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 bg-white border-blue-200 placeholder-blue-300 text-blue-900" 
                    placeholder={t('calendarNotesPlaceholder')} 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )} />
            
            <DialogFooter className="pt-2">
              <div className="flex w-full gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {t('calendarCancel')}
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0" 
                  disabled={isPending}
                >
                  {isPending ? t('calendarAdding') : t('calendarAddDeadline')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 