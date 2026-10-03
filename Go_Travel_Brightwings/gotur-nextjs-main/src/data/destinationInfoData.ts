interface DestinationInfoItem {
    label: string;
    value: string;
  }

  const destinationInfo: DestinationInfoItem[] = [
    { label: 'Country', value: 'Dubai' },
    { label: 'Visa Requirements', value: 'Yes' },
    { label: 'Per Person', value: '---' },
    { label: 'Languages', value: 'Hindi / English' },
    { label: 'Area(Km²)', value: '4,114 Km²' },
  ];
  
  export const mapEmbedUrl =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d462563.03260617296!2d54.89784196647405!3d25.075658424793428!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f43496ad9c645%3A0xbde66e5084295162!2sDubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sin!4v1760870236739!5m2!1sen!2sin';
  
  export default destinationInfo;
  