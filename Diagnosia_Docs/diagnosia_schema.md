  
            **Diagnosia \- Database Schema Design**

## **1\. User Management Tables**

### **users**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| user\_id | SERIAL | PRIMARY KEY | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| password\_hash | VARCHAR(255) | NOT NULL | Encrypted password |
| first\_name | VARCHAR(100) | NOT NULL | First name |
| last\_name | VARCHAR(100) | NOT NULL | Last name |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Phone number |
| date\_of\_birth | DATE | NOT NULL | Date of birth |
| gender | ENUM('male', 'female', 'other') | NOT NULL | Gender |
| is\_active | BOOLEAN | DEFAULT TRUE | Account status |
| created\_at | TIMESTAMP | DEFAULT NOW() | Registration timestamp |
| updated\_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### **user\_roles**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| role\_id | SERIAL | PRIMARY KEY | Unique role identifier |
| role\_name | VARCHAR(50) | UNIQUE, NOT NULL | Role name |
| role\_description | TEXT |  | Role description |

**Default Roles:**

* `patient` \- Book tests, view reports  
* `sample_collector` \- Manage sample collection  
* `lab_technician` \- Process samples, upload reports  
* `admin` \- Full system access  
* `lab_manager` \- Manage lab operations

### **User\_role\_assignments PRIMARY KEY (user\_id, role\_id)**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | User reference |
| role\_id | INTEGER | FOREIGN KEY → user\_roles(role\_id) | Role reference |

### 

### **user\_addresses**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| address\_id | SERIAL | PRIMARY KEY | Unique address identifier |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | User reference |
| address | VARCHAR(500) | NOT NULL | Full address |

## **2\. Test Management Tables**

### **test\_categories**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| category\_id | SERIAL | PRIMARY KEY | Unique category identifier |
| category\_name | VARCHAR(100) | UNIQUE, NOT NULL | Category name |
| category\_description | TEXT |  | Category description |
| category\_icon | VARCHAR(255) |  | Icon URL/path |

### 

### 

### **tests**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| test\_code | VARCHAR(50) | PRIMARY KEY | Test code |
| test\_name | VARCHAR(255) | NOT NULL | Test name |
| test\_description | TEXT |  | Detailed description |
| category\_id | INTEGER | FOREIGN KEY → test\_categories(category\_id) | Category reference |
| base\_price | DECIMAL(10,2) | NOT NULL | Base test price |
| duration\_hours | INTEGER | NOT NULL | Result processing time |
| preparation\_instructions | TEXT |  | Pre-test instructions |
| sample\_type | VARCHAR(100) | NOT NULL | Sample required (blood, urine, etc.) |
| fasting\_required | BOOLEAN | DEFAULT FALSE | Fasting requirement |
| fasting\_hours | INTEGER |  | Required fasting hours |
| gender\_specific | VARCHAR(20) |  | Gender restriction if any |

## 

## 

## 

## 

## **3\. Appointment Management Tables**

### **appointments**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| appointment\_id | SERIAL | PRIMARY KEY | Unique appointment identifier |
| patient\_id | INTEGER | FOREIGN KEY → users(user\_id) | Patient reference |
| appointment\_date | DATE | NOT NULL | Appointment date |
| appointment\_time | TIME | NOT NULL | Appointment time |
| appointment\_type | ENUM('lab\_visit', 'home\_collection') | NOT NULL | Appointment type |
| collection\_address\_id | INTEGER | FOREIGN KEY → user\_addresses(address\_id) | Collection address (if home) |
| status | ENUM('booked', 'cancelled', 'rescheduled', 'no\_show', 'sample\_collected', 'result\_published') | DEFAULT 'booked' | Appointment status |
| total\_amount | DECIMAL(10,2) | NOT NULL | Total appointment cost |
| special\_instructions | TEXT |  | Special requirements |
| cancellation\_reason | TEXT |  | Cancellation reason |
| cancelled\_by | INTEGER | FOREIGN KEY → users(user\_id) | Who cancelled |
| cancelled\_at | TIMESTAMP |  | Cancellation timestamp |
| rescheduled\_from | INTEGER | FOREIGN KEY → appointments(appointment\_id) | Original appointment |
| rescheduled\_reason | TEXT |  | Reschedule reason |
| created\_at | TIMESTAMP | DEFAULT NOW() | Booking timestamp |
| updated\_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

### **appointment\_tests**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| appointment\_test\_id | SERIAL | PRIMARY KEY | Unique mapping identifier |
| appointment\_id | INTEGER | FOREIGN KEY → appointments(appointment\_id) | Appointment reference |
| test\_code | VARCHAR(50) | FOREIGN KEY → tests(test\_code) | Test reference |
| test\_price | DECIMAL(10,2) | NOT NULL | Test price at booking |
| patient\_name | VARCHAR(255) | NOT NULL | Patient name for test |
| patient\_age | INTEGER | NOT NULL | Patient age |
| patient\_gender | ENUM('male', 'female', 'other') | NOT NULL | Patient gender |
| status | ENUM('booked', 'cancelled', 'rescheduled', 'no\_show', 'sample\_collected', 'result\_published') | DEFAULT 'booked' | Individual test status |

## 

## 

## 

## **4\. Sample Management Tables**

### **samples**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| sample\_id | SERIAL | PRIMARY KEY | Unique sample identifier |
| sample\_code | VARCHAR(50) | UNIQUE, NOT NULL | Sample barcode/ID |
| appointment\_test\_id | INTEGER | FOREIGN KEY → appointment\_tests(appointment\_test\_id) | Test reference |
| collected\_by | INTEGER | FOREIGN KEY → users(user\_id) | Sample collector |
| collected\_at | TIMESTAMP |  | Collection timestamp |
| collection\_method | VARCHAR(100) |  | How sample was collected |
| sample\_quality | ENUM('good', 'acceptable', 'poor', 'rejected') |  | Sample quality assessment |
| storage\_location | VARCHAR(100) |  | Where sample is stored |
| temperature\_maintained | BOOLEAN | DEFAULT TRUE | Temperature chain maintained |
| received\_by\_lab | INTEGER | FOREIGN KEY → users(user\_id) | Lab technician who received |
| received\_at | TIMESTAMP |  | Lab receipt timestamp |
| processing\_started\_at | TIMESTAMP |  | Processing start time |
| processing\_completed\_at | TIMESTAMP |  | Processing completion time |
| status | ENUM('collected', 'in\_transit', 'received', 'processing', 'completed', 'rejected') | DEFAULT 'collected' | Sample status |
| rejection\_reason | TEXT |  | Why sample was rejected |
| notes | TEXT |  | Additional notes |

## **5\. Results Management Tables**

### **test\_results**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| result\_id | SERIAL | PRIMARY KEY | Unique result identifier |
| sample\_id | INTEGER | FOREIGN KEY → samples(sample\_id) | Sample reference |
| test\_code | VARCHAR(50) | FOREIGN KEY → tests(test\_code) | Test reference |
| processed\_by | INTEGER | FOREIGN KEY → users(user\_id) | Lab technician |
| verified\_by | INTEGER | FOREIGN KEY → users(user\_id) | Quality checker |
| result\_values | JSONB | NOT NULL | Test results data |
| reference\_ranges | JSONB |  | Normal reference ranges |
| abnormal\_flags | JSONB |  | Abnormal value indicators |
| interpretation | TEXT |  | Result interpretation |
| recommendations | TEXT |  | Medical recommendations |
| critical\_values | BOOLEAN | DEFAULT FALSE | Critical result flag |
| result\_status | ENUM('draft', 'preliminary', 'final', 'amended', 'cancelled') | DEFAULT 'draft' | Result status |
| processed\_at | TIMESTAMP | DEFAULT NOW() | Processing timestamp |
| verified\_at | TIMESTAMP |  | Verification timestamp |
| released\_at | TIMESTAMP |  | Release timestamp |
| amended\_reason | TEXT |  | Amendment reason |
| notes | TEXT |  | Additional notes |

### **test\_reports**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| report\_id | SERIAL | PRIMARY KEY | Unique report identifier |
| appointment\_id | INTEGER | FOREIGN KEY → appointments(appointment\_id) | Appointment reference |
| report\_number | VARCHAR(50) | UNIQUE, NOT NULL | Report reference number |
| report\_date | DATE | NOT NULL | Report generation date |
| report\_type | ENUM('individual', 'consolidated') | NOT NULL | Report type |
| report\_file\_path | VARCHAR(500) |  | PDF file location |
| report\_file\_name | VARCHAR(255) |  | Original filename |
| file\_size\_kb | INTEGER |  | File size |
| generated\_by | INTEGER | FOREIGN KEY → users(user\_id) | Who generated report |
| approved\_by | INTEGER | FOREIGN KEY → users(user\_id) | Medical approval |
| patient\_notified | BOOLEAN | DEFAULT FALSE | Notification sent flag |
| patient\_downloaded | BOOLEAN | DEFAULT FALSE | Download status |
| download\_count | INTEGER | DEFAULT 0 | Download counter |
| first\_downloaded\_at | TIMESTAMP |  | First download time |
| last\_downloaded\_at | TIMESTAMP |  | Last download time |
| is\_active | BOOLEAN | DEFAULT TRUE | Report validity |
| created\_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

## **6\. Payment Management Tables**

### **payment\_methods**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| method\_id | SERIAL | PRIMARY KEY | Unique method identifier |
| method\_name | VARCHAR(100) | NOT NULL | Payment method name |
| method\_type | ENUM('online', 'cash', 'card', 'wallet', 'upi') | NOT NULL | Method type |
| is\_active | BOOLEAN | DEFAULT TRUE | Method availability |

### **payments**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| payment\_id | SERIAL | PRIMARY KEY | Unique payment identifier |
| payment\_reference | VARCHAR(100) | UNIQUE, NOT NULL | Payment reference |
| appointment\_id | INTEGER | FOREIGN KEY → appointments(appointment\_id) | Appointment reference |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | User making payment |
| payment\_method\_id | INTEGER | FOREIGN KEY → payment\_methods(method\_id) | Payment method |
| amount | DECIMAL(10,2) | NOT NULL | Payment amount |
| currency | VARCHAR(10) | DEFAULT 'INR' | Currency code |
| payment\_status | ENUM('success', 'failed', 'refunded') | DEFAULT 'success' | Payment status |
| gateway\_response | JSONB |  | Payment gateway response |
| transaction\_id | VARCHAR(100) |  | Gateway transaction ID |
| completed\_at | TIMESTAMP | DEFAULT NOW() | Payment completion |
| failure\_reason | TEXT |  | Failure description |
| refund\_amount | DECIMAL(10,2) | DEFAULT 0 | Refunded amount |
| refund\_reason | TEXT |  | Refund reason |
| refunded\_at | TIMESTAMP |  | Refund timestamp |

## **7\. Notification System Tables** 

### **notification\_templates**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| template\_id | SERIAL | PRIMARY KEY | Unique template identifier |
| template\_name | VARCHAR(100) | UNIQUE, NOT NULL | Template name |
| event\_trigger | VARCHAR(100) | NOT NULL | Triggering event |
| subject\_template | VARCHAR(500) |  | Email subject template |
| body\_template | TEXT | NOT NULL | Email body template |
| variables | JSONB |  | Available variables |
| is\_active | BOOLEAN | DEFAULT TRUE | Template status |
| created\_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

### **notifications**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| notification\_id | SERIAL | PRIMARY KEY | Unique notification identifier |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | Recipient |
| template\_id | INTEGER | FOREIGN KEY → notification\_templates(template\_id) | Template used |
| subject | VARCHAR(500) |  | Email subject |
| message | TEXT | NOT NULL | Email message |
| status | ENUM('pending', 'sent', 'delivered', 'failed') | DEFAULT 'pending' | Email status |
| priority | ENUM('low', 'normal', 'high', 'urgent') | DEFAULT 'normal' | Priority level |
| related\_entity\_type | VARCHAR(50) |  | Related entity (appointment, result, etc.) |
| related\_entity\_id | INTEGER |  | Related entity ID |
| scheduled\_at | TIMESTAMP |  | Scheduled send time |
| sent\_at | TIMESTAMP |  | Actual send time |
| delivered\_at | TIMESTAMP |  | Delivery confirmation |
| failure\_reason | TEXT |  | Failure description |
| retry\_count | INTEGER | DEFAULT 0 | Retry attempts |
| created\_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

## **8\. System Configuration Tables**

### **system\_settings**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| setting\_id | SERIAL | PRIMARY KEY | Unique setting identifier |
| setting\_key | VARCHAR(100) | UNIQUE, NOT NULL | Setting key |
| setting\_value | TEXT |  | Setting value |
| setting\_type | ENUM('string', 'number', 'boolean', 'json') | DEFAULT 'string' | Value type |
| description | TEXT |  | Setting description |
| category | VARCHAR(100) |  | Setting category |
| is\_public | BOOLEAN | DEFAULT FALSE | Publicly accessible |
| updated\_by | INTEGER | FOREIGN KEY → users(user\_id) | Who updated |
| updated\_at | TIMESTAMP | DEFAULT NOW() | Update timestamp |

### **audit\_logs**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| log\_id | SERIAL | PRIMARY KEY | Unique log identifier |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | User performing action |
| action | VARCHAR(100) | NOT NULL | Action performed |
| entity\_type | VARCHAR(100) | NOT NULL | Affected entity type |
| entity\_id | INTEGER |  | Affected entity ID |
| old\_values | JSONB |  | Previous values |
| new\_values | JSONB |  | New values |
| ip\_address | INET |  | User IP address |
| user\_agent | TEXT |  | User browser/app |
| timestamp | TIMESTAMP | DEFAULT NOW() | Action timestamp |
| session\_id | VARCHAR(255) |  | User session |

## **10\. Chatbot Support Tables**

### **chatbot\_conversations**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| conversation\_id | SERIAL | PRIMARY KEY | Unique conversation identifier |
| user\_id | INTEGER | FOREIGN KEY → users(user\_id) | User (if logged in) |
| session\_id | VARCHAR(255) | NOT NULL | Session identifier |
| started\_at | TIMESTAMP | DEFAULT NOW() | Conversation start |
| ended\_at | TIMESTAMP |  | Conversation end |
| status | ENUM('active', 'ended', 'escalated') | DEFAULT 'active' | Conversation status |
| escalated\_to | INTEGER | FOREIGN KEY → users(user\_id) | Human agent |
| satisfaction\_rating | INTEGER |  | User rating (1-5) |
| feedback | TEXT |  | User feedback |

### **chatbot\_messages**

| Column | Type | Constraints | Description |
| ----- | ----- | ----- | ----- |
| message\_id | SERIAL | PRIMARY KEY | Unique message identifier |
| conversation\_id | INTEGER | FOREIGN KEY → chatbot\_conversations(conversation\_id) | Conversation reference |
| sender\_type | ENUM('user', 'bot', 'agent') | NOT NULL | Message sender |
| message\_text | TEXT | NOT NULL | Message content |
| intent | VARCHAR(100) |  | Detected intent |
| confidence\_score | DECIMAL(5,4) |  | Confidence level |
| response\_time\_ms | INTEGER |  | Bot response time |
| created\_at | TIMESTAMP | DEFAULT NOW() | Message timestamp |

## 

## 

## 

## 

## 

## 

## **Database Relationships Summary**

### **Primary Relationships:**

1. **Users → Roles (Many-to-Many)**  
   * `user_role_assignments` links users to roles  
2. **Users → Addresses (One-to-Many)**  
   * Users can have multiple addresses  
3. **Tests → Categories (Many-to-One)**  
   * Each test belongs to one category  
4. **Appointments → Users (Many-to-One)**  
   * Each appointment belongs to one patient  
5. **Appointments → Tests (Many-to-Many)**  
   * `appointment_tests` links appointments to tests  
6. **Samples → Appointment Tests (One-to-One)**  
   * Each sample corresponds to one appointment test  
7. **Test Results → Samples (One-to-One)**  
   * Each sample has one result  
8. **Payments → Appointments (Many-to-One)**  
   * Multiple payments can be made for one appointment  
9. **Lab Centers → Tests (Many-to-Many)**  
   * `center_tests` links centers to available tests  
10. **Staff Assignments → Appointments (Many-to-Many)**  
    * `appointment_assignments` tracks staff assignments

