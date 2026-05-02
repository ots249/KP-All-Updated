import { CourseSection, CourseContent } from '../types';

export function getBangladeshTime(date = new Date()) {
    return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
}

export function getBangladeshNow() {
    return getBangladeshTime(new Date());
}

export interface LiveDetails {
    title: string;
    section: string;
    start: Date;
    end: Date;
    link: string;
}

export function checkLiveContent(sections: CourseSection[]): LiveDetails | null {
    const bangladeshNow = getBangladeshNow();
    
    for (const section of sections) {
        if (section.contents && section.contents.length > 0) {
            for (const content of section.contents) {
                if (content.type !== 'live') continue;
                
                let startTime: Date | null = null;
                let endTime: Date | null = null;
                let liveLink: string | null = null;
                
                const resourceable = content.resource?.resourceable;
                if (resourceable) {
                    if (resourceable.start_time) {
                        startTime = new Date(resourceable.start_time);
                    }
                    if (resourceable.end_time) {
                        endTime = new Date(resourceable.end_time);
                    }
                    liveLink = resourceable.link || content.link || null;
                } else if (content.link) {
                    liveLink = content.link;
                }
                
                if (startTime) {
                    const startTimeBD = getBangladeshTime(startTime);
                    let endTimeBD: Date;
                    
                    if (endTime) {
                        endTimeBD = getBangladeshTime(endTime);
                        if (endTimeBD <= startTimeBD) {
                            endTimeBD = new Date(startTimeBD.getTime() + (2 * 60 * 60 * 1000));
                        }
                    } else {
                        endTimeBD = new Date(startTimeBD.getTime() + (2 * 60 * 60 * 1000));
                    }
                    
                    if (bangladeshNow >= startTimeBD && bangladeshNow <= endTimeBD) {
                        return {
                            title: content.title,
                            section: section.title,
                            start: startTimeBD,
                            end: endTimeBD,
                            link: liveLink || ''
                        };
                    }
                }
            }
        }
    }
    
    return null;
}

export function isItemNew(availableFrom?: string): boolean {
    if (!availableFrom) return false;
    
    const availableDate = new Date(availableFrom);
    const availableTimeBD = getBangladeshTime(availableDate).getTime();
    const expiryTimeBD = availableTimeBD + (24 * 60 * 60 * 1000); // 24 hours later
    const bangladeshNow = getBangladeshNow().getTime();
    
    return bangladeshNow < expiryTimeBD;
}
