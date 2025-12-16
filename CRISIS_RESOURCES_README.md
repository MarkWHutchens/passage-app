# Crisis Resources System

## Overview
This system provides country-specific crisis support resources that are always accessible to users and can be surfaced by Claude in conversations when someone is in distress.

## Features

### Part 1: User-Facing UI
1. **Always-visible Access**: Crisis Support button (🆘) in the bottom navigation
2. **Country-Specific Resources**: Shows crisis resources based on user's country setting
3. **Country Detection**: 
   - Reads from user profile `country` field
   - If not set, shows country selector modal
   - Saves selection to user profile
4. **Formatted Display**: Markdown content with prominent emergency numbers and categorized resources

### Part 2: Backend & Admin

1. **Database Table**: `crisis_resources`
   - `id` (uuid)
   - `country_code` (text) - 'AU', 'US', 'UK', 'CA', 'NZ', 'IE', 'OTHER'
   - `country_name` (text)
   - `content` (text) - Markdown formatted content
   - `created_at`, `updated_at`

2. **API Endpoints**:
   - `GET /api/crisis-resources?country=XX` - Fetch resources by country code
   - `POST /api/crisis-resources` - List all available countries
   - `GET /api/admin/crisis-resources` - List all resources (admin)
   - `PUT /api/admin/crisis-resources` - Update resource (admin)

3. **Admin Interface**: `/admin/crisis-resources`
   - View all country resources
   - Edit markdown content per country
   - Preview formatted content

## Database Migration

Run the migration to set up the tables and seed initial data:

```bash
# Apply the migration to your Supabase database
# You can do this via Supabase dashboard SQL editor or CLI
```

The migration file is located at: `supabase/migrations/005_crisis_resources.sql`

## Seeded Countries

The system comes pre-populated with crisis resources for:
- Australia (AU)
- United States (US)
- United Kingdom (UK)
- Canada (CA)
- New Zealand (NZ)
- Ireland (IE)
- International/Other (OTHER)

## Claude Integration

Claude has been updated to:
1. Detect when users express suicidal ideation, self-harm thoughts, or are in immediate crisis
2. Immediately direct them to the Crisis Support button with clear instructions
3. Provide compassionate but direct guidance on accessing help

The prompt includes:
> "I hear how much pain you're in right now. Please know that immediate help is available - tap the Crisis Support button (🆘) in the menu at the bottom of the screen to see crisis hotlines for your country. These services are available 24/7 and can provide the immediate support you need."

## User Flow

1. User opens app → Crisis button (🆘) visible in bottom nav
2. User taps Crisis button → System checks user's country setting
3. If country is set → Show resources for that country
4. If country is not set → Show country selector modal
5. User selects country → Resources displayed + country saved to profile
6. User can change country anytime via "Change" button in header

## Admin Management

1. Navigate to `/admin/crisis-resources`
2. View list of all countries
3. Click "Edit" on any country
4. Update country name or markdown content
5. Save changes
6. Resources immediately available to all users

## Content Format

Resources are stored in Markdown format with the following structure:

```markdown
# Emergency Number: XXX

## 24/7 Crisis Support

### Service Name
**Call: XXXX**
**Chat: [link](url)**
- Description point 1
- Description point 2

## Additional Support

### Another Service
**Call: XXXX**
- Description
```

## Security

- Crisis resources table has Row Level Security (RLS) enabled
- Anyone can READ resources (critical for safety)
- Only authenticated users can UPDATE resources (admin function)
- User country preference stored in users table with RLS

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] Crisis button visible in bottom navigation
- [ ] Clicking Crisis button shows resources or country selector
- [ ] Country selector allows choosing country
- [ ] Resources display correctly in Markdown format
- [ ] "Change" button allows switching countries
- [ ] Country preference saved to user profile
- [ ] Admin page loads all resources
- [ ] Admin can edit and save resource content
- [ ] Claude directs users to Crisis Support when detecting distress

## Future Enhancements

- Add more countries
- Translate resources into multiple languages
- Analytics on crisis resource usage (privacy-preserving)
- Integration with local crisis services APIs
- Offline access to crisis resources (PWA)
