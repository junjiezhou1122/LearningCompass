-- SQL script to add tags column to university_course_resources table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'university_course_resources' AND column_name = 'tags'
  ) THEN
    ALTER TABLE university_course_resources ADD COLUMN tags text[] DEFAULT '{}'::text[];
    RAISE NOTICE 'Added tags column to university_course_resources table';
  ELSE
    RAISE NOTICE 'tags column already exists in university_course_resources table';
  END IF;
END$$;