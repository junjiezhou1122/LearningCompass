import React from 'react';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-white hover:bg-amber-600"
          aria-label={t('language')}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          className={`cursor-pointer ${language === LANGUAGES.ENGLISH ? 'font-bold bg-amber-50' : ''}`}
          onClick={() => setLanguage(LANGUAGES.ENGLISH)}
        >
          <div className="flex items-center">
            <span className="mr-2">🇺🇸</span>
            <span>{t('english')}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={`cursor-pointer ${language === LANGUAGES.CHINESE ? 'font-bold bg-amber-50' : ''}`}
          onClick={() => setLanguage(LANGUAGES.CHINESE)}
        >
          <div className="flex items-center">
            <span className="mr-2">🇨🇳</span>
            <span>{t('chinese')}</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;