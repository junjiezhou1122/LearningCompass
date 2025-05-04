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
          className="text-[#b5bac1] hover:text-white hover:bg-[#3f4248] rounded-sm"
          aria-label={t('language')}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#313338] border-[#1e1f22] text-[#f2f3f5]">
        <DropdownMenuItem 
          className={`cursor-pointer hover:bg-[#3f4248] ${language === LANGUAGES.ENGLISH ? 'font-medium text-white bg-[#3f4248]' : 'text-[#b5bac1]'}`}
          onClick={() => setLanguage(LANGUAGES.ENGLISH)}
        >
          <div className="flex items-center">
            <span className="mr-2">🇺🇸</span>
            <span>{t('english')}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={`cursor-pointer hover:bg-[#3f4248] ${language === LANGUAGES.CHINESE ? 'font-medium text-white bg-[#3f4248]' : 'text-[#b5bac1]'}`}
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