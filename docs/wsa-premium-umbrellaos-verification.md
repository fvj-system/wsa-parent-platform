# WSA Premium Homeschool + UmbrellaOS Verification

Use this checklist to verify the first full WSA Premium Homeschool + UmbrellaOS foundation inside the existing WSA app.

## Preconditions

1. Run the new Supabase migration: `supabase/migrations/0030_wsa_premium_umbrellaos.sql`
2. Confirm environment variables exist when available:
   `NEXT_PUBLIC_SUPABASE_URL`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   `SUPABASE_SERVICE_ROLE_KEY`
   `OPENAI_API_KEY`
   `APP_BASE_URL`
3. Start the app with `npm run dev`
4. Sign in with a normal family account

## Premium Flow

1. Open `/dashboard/premium`
2. Confirm the premium dashboard page exists
3. Confirm the Maryland 8-subject tracker is visible
4. Open `/dashboard/premium/students`
5. Add or select a student
6. Confirm a student record exists in the `students` table with premium fields populated
7. Open `/dashboard/premium/lessons`
8. Generate Today’s Plan
9. Confirm a `lesson_plans` row exists
10. Confirm related `daily_assignments` rows exist
11. Open `/dashboard/premium/worksheets`
12. Generate a worksheet
13. Confirm a `worksheets` row exists
14. Open `/dashboard/premium/portfolio`
15. Upload or create a portfolio item
16. Confirm a `portfolio_items` row exists
17. Use AI Suggest Tags
18. Confirm tags and save the evidence item
19. Confirm `portfolio_subject_tags` rows exist
20. Re-open `/dashboard/premium`
21. Confirm the Maryland subject tracker updates
22. Open `/dashboard/premium/review-packet`
23. Build review packet
24. Confirm a `review_packets` row exists
25. Print review packet from the browser

## UmbrellaOS Flow

1. Open `/dashboard/umbrella`
2. Confirm the UmbrellaOS home page exists
3. Open `/dashboard/umbrella/reviewers`
4. If using an admin account, create a reviewer profile and assignment
5. Open `/dashboard/premium/review-packet`
6. Submit review packet for human review
7. Confirm a `reviews` row exists
8. Confirm `review_findings` rows exist
9. Open `/dashboard/umbrella/reviews`
10. Select the submitted review
11. Mark subjects sufficient, weak, or missing
12. Approve or request correction
13. Confirm the reviewer decision can be saved
14. Open `/dashboard/umbrella/enrollments`
15. If using an admin account, save an enrollment record
16. Confirm an `umbrella_enrollments` row exists
17. Open `/dashboard/umbrella/compliance`
18. Confirm compliance summary cards render

## Audit Proof

1. Confirm `audit_logs` rows exist for:
   `lesson_generated`
   `worksheet_generated`
   `portfolio_item_created`
   `portfolio_item_tagged`
   `review_packet_generated`
   `review_submitted_for_human_review`
   `review_decision_saved`
2. Confirm `ai_generation_logs` rows exist for:
   `lesson_planner`
   `worksheet_generator`
   `portfolio_tagger`
   `review_summarizer`

## Measurable Outputs

1. Premium dashboard page exists
2. Maryland 8-subject tracker visible
3. Student record exists in database
4. Lesson plan record exists in database
5. Worksheet record exists in database
6. Portfolio item record exists in database
7. Subject tag record exists in database
8. Review packet view exists
9. Reviewer decision can be saved
10. Audit logs exist for important actions
