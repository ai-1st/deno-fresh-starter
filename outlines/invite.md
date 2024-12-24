The invite functionality allows users to send invites to other users.

### Invite data structure

*   `id`: ulid, it also acts as the secret invite code
*   `invitingUserId`: this is the user who is sending the invite
*   `inviteText`: this is the text sent to the user
*   `code`: this is text that is not visible to the invitees, but the inviting user can track invite performance with these codes
*   `limit`: this is the number of times the invite can be used
*   `used`: this is the number of times the invite has been used
*   `active`: this is a boolean that indicates if the invite is active or not. Invite gets automatically deactivated after the limit is reached

### Invite flow

The process for the user sending the invite:

1.  Log in
2.  Click on the Invites link in the nav bar
3.  See the list of existing invites with a filter on top. Each invite is represented by a card with all the fields and buttons to edit the invite, get the invite link, or show the QR with the invite link
4.  Click on the "New Invite" button.
5.  Fill in the form with the invite details.
6.  Get the invite link by clicking the "Get Invite Link" button.
7.  Show the QR code by clicking the "Show QR" button.
8.  Pass the link or the QR code to the invitee.

The process for the new user not using the app to accept the invite:

1.  Scan the QR code or click the invite link
2.  The invite link has the form of {hostname}/invite/accept/[id] 
3.  Open this page in the browser. The page shows invite details: 
- Invite sender name and the invite text. 
- If the invite is not active, it shows a message that the invite is not active. 
- There's also an explanation to the user that if they accept this invite, 
the inviter will receive their contacts. 
- Links to sign in or sign up using the invite.
4. Invite id is stored in the session at position 2. If the user hasn't a session, a new one is created.
5. User is regirected to the signin/signup page
6. The signin/signup route handlers should check the presence of the invite_id in the session and accept it after the user logs in or signs up.

The process for the user using the app to accept the invite:
1. Open the QR scanner page from the navbar
2. Scan the QR code or user paste the invite link into a field on the page
3. Use an island that retrieves the invite information from the link by fetching it with an extra URI parameter "response=JSON". The invite route handler should enable CORS. The user may be connected to a different node.
4. Show the invite details: invite sender name and the invite text and whether the invite is active
5. There is a "Accept Invite" button to accept the invite, which sends a POST request to the invite url with the invite id and the invitee's contact as the body of the request, and also sends a POST request to the homebase /user/api/contact route with the invite id and the invitee's contact as the body of the request

### Implementation Plan

1. **QR Code Integration**
   - Add QR code generation to the existing invite UI
   - Integrate with `CopyLinkButton` component
   - Deliverable: Users can view and share QR codes for invites
   - Test cases:
     - QR code displays correctly
     - QR code contains correct invite link
     - QR code is scannable by standard readers

2. **Invite Acceptance Flow**
   - Create `/invite/accept/[id]` route
   - Implement invite validation using existing `getInvite` function
   - Store pending invite in session using `setSessionValue`
   - Integrate with existing signin/signup flow
   - Deliverable: Users can view and accept invites
   - Test cases:
     - Invalid/expired invites show appropriate messages
     - Session correctly stores invite ID
     - Redirect to signin/signup works with invite context
     - Existing users can accept via direct link

3. **QR Scanner Implementation**
   - Create QR scanner page
   - Add invite link paste functionality
   - Create invite preview component
   - Implement CORS for cross-node communication
   - Deliverable: Users can scan QR codes to accept invites
   - Test cases:
     - QR scanner successfully reads codes
     - Pasted links are validated
     - Preview shows correct invite details
     - Accept button works as expected

4. **Contact Exchange System**
   - Create contact exchange endpoints using DB interface
   - Add contact sync with homebase
   - Use existing `useInvite` function to track usage
   - Deliverable: Contacts are exchanged upon invite acceptance
   - Test cases:
     - Contact data is properly formatted
     - Both parties receive contact information
     - Homebase sync completes successfully
     - Invite usage count increments correctly

5. **Analytics Dashboard**
   - Create analytics view using existing invite data
   - Add filtering by tracking code
   - Show usage statistics and conversion rates
   - Deliverable: Users can track invite performance
   - Test cases:
     - Dashboard shows accurate stats
     - Filters work correctly
     - Data updates in real-time

6. **Security and Error Handling**
   - Implement rate limiting for invite creation/acceptance
   - Add input validation for all forms
   - Create error pages and messages
   - Deliverable: System handles edge cases gracefully
   - Test cases:
     - Rate limits prevent abuse
     - Invalid inputs show helpful errors
     - Edge cases don't crash the system

Each step should be completed sequentially, with all test cases passing before moving to the next step. The UI should be tested in both mobile and desktop views to ensure responsive design.
