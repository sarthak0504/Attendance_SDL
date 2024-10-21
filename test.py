import fitz  # PyMuPDF
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  


driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
baseurl = "https://web.whatsapp.com"

if len(sys.argv) < 2:
    print("Error: No file path provided.")
    sys.exit(1)

file_path = sys.argv[1]
if not os.path.exists(file_path):
    print(f"Error: File does not exist at {file_path}")
    sys.exit(1)


doc = fitz.open(file_path)


subject_info = doc[0].get_text("text").strip().splitlines()
attendance_info = doc[1].get_text("text").strip().splitlines()


subjects = [line.split(":")[1].strip() for line in subject_info if ":" in line]


attendance_data = []
for line in attendance_info:
    parts = line.split(",")  
    if len(parts) >= 4:
        attendance_data.append({
            'Enrollement': parts[0].strip(),
            'Name': parts[1].strip(),
            'Total Percentage': float(parts[2].strip()),
            'Contact': parts[3].strip()
        })


students_below_75 = [student for student in attendance_data if student['Total Percentage'] < 75]


driver.get(baseurl)
print("Please scan the QR code within 30 seconds.")
time.sleep(30)  

wait = WebDriverWait(driver, 10)

def send_whatsapp_messages_batch(students):
    for student in students:
        contact = student['Contact']
        student_name = student['Name']
        percentage = int(student['Total Percentage'])
        
        
        message = [
            f"Dear Sir/Mam, Your ward {student_name} has {percentage}% attendance.",
            "Please take some action, otherwise they may be detained.",
            "Below are the subjectwise attendance:",
            f"{subjects[0]}: {subject1}%",
            f"{subjects[1]}: {subject2}%",
            f"{subjects[2]}: {subject3}%",
            f"{subjects[3]}: {subject4}%"
        ]

        try:
            search_box = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true" and @data-tab="3"]')))
            search_box.click()
            search_box.clear()
            search_box.send_keys(f"+91{contact}")
            time.sleep(4)  
            search_box.send_keys(Keys.ENTER)

            
            message_box = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true" and @data-tab="10"]')))
            message_box.click()

            for line in message:
                message_box.send_keys(line)
                message_box.send_keys(Keys.SHIFT + Keys.ENTER)

            message_box.send_keys(Keys.ENTER)

            time.sleep(4)  # Wait a bit before the next message to avoid issues
        except Exception as e:
            print(f"Failed to send message to {student_name}'s parent ({contact}). Error: {str(e)}")
            time.sleep(4)

    
    driver.quit()

send_whatsapp_messages_batch(students_below_75)
