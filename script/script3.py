#!/usr/bin/env python3
import fitz  # PyMuPDF
import sys
import os
from datetime import datetime





def fill_certificate_figma_style(template_path, student_name="Vayras", completion_date="18th MAR 2025", output_path=None):

    if output_path is None:
        safe_name = student_name.replace(' ', '_').replace('.', '')
        output_path = f"{safe_name}_bitcoin_certificate.pdf"
    
    try:
        # Open the PDF
        doc = fitz.open(template_path)
        page = doc[0]  # First page
        

        # Add student name exactly like Figma design
        # Position: x=1051, y=468 (from Figma coordinates)
        name_position = fitz.Point(820, 855)
        page.insert_text(
            name_position,
            student_name,
            fontsize=450,  # Larger font size to match the script style
            color=(0, 0, 0),  # Black color
            fontfile="monospace"  # Helvetica font
        )
        
        name_position_2 = fitz.Point(1450, 1381)
        page.insert_text(
            name_position_2,
            student_name,
            fontsize=50,  # Larger font size to match the script style
            color=(0, 0, 0),  # Black color
            fontname="helv"   # Helvetica font
        )
        
        # Add completion date at the bottom
        # Based on the Figma design, the date appears to be around the bottom area
        date_position = fitz.Point(710, 1580)  # Centered position for date
        page.insert_text(
            date_position,
            completion_date,
            fontsize=60,
            color=(0, 0, 0),
            fontname="helv"
        )
        
        # Save the result
        doc.save(output_path)
        doc.close()
        
        print(f"✅ Certificate created successfully: {output_path}")
        print(f"   Student: {student_name}")
        print(f"   Date: {completion_date}")
        print(f"   Style: Figma design replica")
        return True
        
    except Exception as e:
        print(f"❌ Error creating certificate: {str(e)}")
        return False

def create_vayras_certificate():
    """Create the exact certificate shown in Figma"""
    template_file = "certTemp.pdf"
    
    if not os.path.exists(template_file):
        print(f"❌ Template file not found: {template_file}")
        print("Please place your PDF template in the same directory as this script.")
        return False
    
    print("🎨 Creating certificate exactly like Figma design...")
    print("   Name: Vayras")
    print("   Date: 18th MAR 2025")
    print("   Coordinates: x=1051, y=468")
    print()
    
    return fill_certificate_figma_style(
        template_file,
        "Vayras",
        "18th MAR 2025",
        "Vayras_bitcoin_certificate.pdf"
    )

def create_custom_certificate():
    """Interactive mode for custom certificates"""
    template_file = "certTemp.pdf"
    
    if not os.path.exists(template_file):
        print(f"❌ Template file not found: {template_file}")
        return False
    
    print("=== Custom Certificate Creator ===")
    print("Using Figma design coordinates and styling")
    print()
    
    # Get student information
    student_name = input("Enter student name (or press Enter for 'Vayras'): ").strip()
    if not student_name:
        student_name = "Vayras"
    
    # Get completion date
    completion_date = input("Enter completion date (or press Enter for '18th MAR 2025'): ").strip()
    if not completion_date:
        completion_date = "18th MAR 2025"
    
    return fill_certificate_figma_style(template_file, student_name, completion_date)

def batch_create_certificates():
    """Create multiple certificates with Figma styling"""
    template_file = "certTemp.pdf"
    
    if not os.path.exists(template_file):
        print(f"❌ Template file not found: {template_file}")
        return False
    
    # Sample student data - you can modify this list
    students = [
        {"name": "Vayras", "date": "18th MAR 2025"},
 
    ]
    
    print(f"📊 Creating {len(students)} certificates...")
    success_count = 0
    
    for student in students:
        name = student["name"]
        date = student["date"]
        
        if fill_certificate_figma_style(template_file, name, date):
            success_count += 1
        print()  # Empty line between certificates
    
    print(f"✅ Summary: {success_count}/{len(students)} certificates created successfully")
    return success_count == len(students)

def test_positioning():
    """Test the positioning with sample data"""
    template_file = "certTemp.pdf"
    
    if not os.path.exists(template_file):
        print(f"❌ Template file not found: {template_file}")
        return False
    
    print("🧪 Testing Figma coordinates...")
    print("   This will create a test certificate to verify positioning")
    
    result = fill_certificate_figma_style(
        template_file,
        "TEST STUDENT",
        "TEST DATE",
        "TEST_figma_positioning.pdf"
    )
    
    if result:
        print("✅ Test completed!")
        print("📝 Check 'TEST_figma_positioning.pdf' to verify:")
        print("   - Name should be positioned exactly like in Figma")
        print("   - Date should be at the bottom center")
        print("   - Font sizes should match the design")
    
    return result

if __name__ == "__main__":
    print("🎨 Bitcoin Certificate Generator - Figma Style")
    print("=" * 50)
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "vayras":
            # Create the exact Figma certificate
            create_vayras_certificate()
            
        elif command == "test":
            # Test positioning
            test_positioning()
            
        elif command == "batch":
            # Batch create multiple certificates
            batch_create_certificates()
            
        elif command == "custom":
            # Interactive custom certificate
            create_custom_certificate()
            
        else:
            print("Available commands:")
            print("  vayras  - Create exact Figma certificate (Vayras, 18th MAR 2025)")
            print("  test    - Test positioning with sample data")
            print("  custom  - Interactive mode for custom certificates")
            print("  batch   - Create multiple certificates")
            print()
            print("Example: python script.py vayras")
    
    else:
        # Default: Create the Figma certificate
        print("Creating Figma-style certificate...")
        print("Use 'python script.py custom' for interactive mode")
        print()
        create_vayras_certificate()